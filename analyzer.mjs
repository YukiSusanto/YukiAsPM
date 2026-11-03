const speechWords = /话术|文案|开场白|回复语|这句|这个说法/;
const changeWords = /优化|润色|调整|修改|改成|改为|更自然|更简洁|太生硬|不合适/;
const negatedChange = /(?:不要|不用|不必|不需要|不建议|不能|无需|暂不|别|取消|停止).{0,12}(?:优化|润色|调整|修改|改成|改为|替换)/;
const directlyNegatedChange = /不(?:再|想|会)?(?:优化|润色|调整|修改|改成|改为|替换)/;
const opposedChange = /(?:不是要|不赞成|不同意|反对).{0,16}(?:优化|润色|调整|修改|改成|改为)|保持原样/;
const deletionWords = /删除|删掉|移除|停用|废弃/;
const negatedDeletion = /(?:不要|不用|不必|不需要|不建议|不能|无需|暂不|别|取消|停止).{0,12}(?:删除|删掉|移除|停用|废弃)/;
const explicitRequest = /#话术优化|(?:话术|文案|开场白|回复语|这句).{0,120}(?:请|能否|可否|希望|建议|需要|帮忙).{0,30}(?:优化|润色|调整|修改)/;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_EVIDENCE_LENGTH = 120;
const MAX_SUGGESTION_LENGTH = 12;
const imageReference = /!\[[^\]]*\]\(img_[^)]+\)|<\/?(?:img|image)\b[^>]*>/i;

function review(event, reason, source) {
  return { state: 'review', messageId: event.message_id, reason, source,
    originalMessage: normalizeMessageContent(event) };
}

export function normalizeMessageContent(event) {
  const content = String(event?.content || '');
  if (event?.message_type !== 'post') return content.trim();
  return content
    .replace(/!\[[^\]]*\]\(img_[^)]+\)/g, '')
    .replace(/<\/?(?:img|image)\b[^>]*>/gi, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function hasMessageImages(event) {
  return event?.message_type === 'post' && imageReference.test(String(event.content || ''));
}

function fallback(event, content) {
  if (negatedChange.test(content) || directlyNegatedChange.test(content) ||
      opposedChange.test(content) || negatedDeletion.test(content)) {
    return review(event, '否定语义，需人工复核', 'regex');
  }
  if (speechWords.test(content) && deletionWords.test(content)) {
    return { state: 'record', source: 'regex', item: makeItem(event, content, '', 'delete') };
  }
  if (explicitRequest.test(content)) {
    return { state: 'record', source: 'regex', item: makeItem(event, content, '', 'optimize') };
  }
  if (speechWords.test(content) && changeWords.test(content)) {
    return review(event, '可能相关，但规则证据不足', 'regex');
  }
  return null;
}

function makeItem(event, content, suggestedText, intent) {
  const timestamp = Number(event.create_time);
  const typeByIntent = { optimize: '优化', delete: '删除', other: '其他' };
  return {
    messageId: event.message_id,
    type: typeByIntent[intent],
    originalMessage: content,
    suggestedText,
    proposerId: typeof event.sender_id === 'string' ? event.sender_id : '',
    messageType: event.message_type,
    hasImages: hasMessageImages(event),
    messageLink: '',
    submittedAt: Number.isFinite(timestamp) && timestamp > 0
      ? new Date(timestamp).toISOString() : '',
  };
}

function validateModelResult(event, content, value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('模型输出不是对象');
  if (!['record', 'ignore', 'review'].includes(value.decision)) throw new Error('模型判定值无效');
  if (!['optimize', 'delete', 'other', 'unclear'].includes(value.intent)) throw new Error('模型意图值无效');
  if (typeof value.evidence !== 'string' || value.evidence.length > MAX_EVIDENCE_LENGTH) {
    throw new Error('模型证据格式无效');
  }
  if (value.suggested_text !== null &&
      (typeof value.suggested_text !== 'string' ||
       Array.from(value.suggested_text.trim()).length > MAX_SUGGESTION_LENGTH)) {
    throw new Error('模型建议格式无效');
  }
  if (value.decision === 'ignore') return null;
  if (value.decision === 'review') return review(event, '模型判定需复核', 'llm');
  if (value.intent === 'unclear') return review(event, '入库类型不明确', 'llm');
  if (!value.evidence || !content.includes(value.evidence)) {
    return review(event, '判定证据未通过原文校验', 'llm');
  }
  if (value.intent === 'optimize' && !changeWords.test(value.evidence)) {
    return review(event, '优化意图证据不足', 'llm');
  }
  if (value.intent === 'delete' && !deletionWords.test(value.evidence)) {
    return review(event, '删除意图证据不足', 'llm');
  }
  if ((value.intent === 'optimize' && (negatedChange.test(content) ||
      directlyNegatedChange.test(content) || opposedChange.test(content) || deletionWords.test(content))) ||
      (value.intent === 'delete' && negatedDeletion.test(content))) {
    return review(event, '意图与消息语义存在冲突', 'llm');
  }
  const suggestion = value.suggested_text === null ? '' : value.suggested_text.trim();
  if (suggestion && value.intent === 'optimize' && !suggestion.endsWith('话术优化')) {
    return review(event, '修改建议格式与优化意图不一致', 'llm');
  }
  if (suggestion && value.intent === 'delete' && !suggestion.endsWith('话术删除')) {
    return review(event, '修改建议格式与删除意图不一致', 'llm');
  }
  return { state: 'record', source: 'llm', item: makeItem(event, content, suggestion, value.intent) };
}

export async function analyzeMessage(event, targetChatId, classify) {
  if (!event || event.chat_id !== targetChatId) return null;
  if (event.chat_type !== 'group' || !['text', 'post'].includes(event.message_type)) return null;
  if (event.sender_type === 'bot' || !event.message_id) return null;
  const content = normalizeMessageContent(event);
  if (!content) return null;
  if (content.length > MAX_MESSAGE_LENGTH) return review(event, '消息超过输入长度上限', 'guard');
  if (!classify) return fallback(event, content);
  try {
    return validateModelResult(event, content, await classify(content));
  } catch {
    return fallback(event, content);
  }
}

export function toBaseFields(item, fieldNames = {}) {
  const names = {
    type: '类型', message: '原始消息', suggestion: '修改建议',
    proposer: '提议人', submittedAt: '提出时间',
    completed: '是否完成', messageId: '', messageLink: '', ...fieldNames,
  };
  const fields = {
    [names.type]: [item.type],
    [names.message]: item.originalMessage,
    [names.completed]: false,
  };
  if (item.suggestedText) fields[names.suggestion] = item.suggestedText;
  if (item.proposerId) fields[names.proposer] = [{ id: item.proposerId }];
  if (item.submittedAt) fields[names.submittedAt] = item.submittedAt;
  if (names.messageId) fields[names.messageId] = item.messageId;
  if (names.messageLink && item.messageLink) fields[names.messageLink] = item.messageLink;
  return fields;
}

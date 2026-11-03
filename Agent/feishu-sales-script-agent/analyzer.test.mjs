import assert from 'node:assert/strict';
import { analyzeMessage, hasMessageImages, normalizeMessageContent, toBaseFields } from './analyzer.mjs';
import { classifyWithOpenAI, llmConfigured, responsesEndpoint } from './llm.mjs';

const base = {
  chat_id: 'oc_target', chat_type: 'group', message_type: 'text',
  sender_type: 'user', message_id: 'om_1', sender_id: 'ou_1',
  create_time: '1790769600000', content: '老师，这个话术xxx，能否优化一下？',
};
const model = result => async () => result;
const good = { decision: 'record', intent: 'optimize',
  evidence: '能否优化一下', suggested_text: null };

const accepted = await analyzeMessage(base, 'oc_target', model(good));
assert.equal(accepted.state, 'record');
assert.equal(accepted.item.originalMessage, base.content);
assert.equal(accepted.item.suggestedText, '');
assert.deepEqual(toBaseFields(accepted.item)['类型'], ['优化']);
assert.equal(toBaseFields(accepted.item)['是否完成'], false);
accepted.item.messageLink = 'https://applink.feishu.cn/client/chat/open';
assert.equal(toBaseFields(accepted.item, { messageLink: '原始消息链接' })['原始消息链接'],
  accepted.item.messageLink);

const implicit = { ...base, message_id: 'om_implicit', content: '这个可以优化一下' };
assert.equal((await analyzeMessage(implicit, 'oc_target', model({
  decision: 'record', intent: 'optimize', evidence: '可以优化一下', suggested_text: null,
}))).state, 'record');

const deletion = { ...base, message_id: 'om_delete', content: '这个话术已经过期，请删除' };
const acceptedDeletion = await analyzeMessage(deletion, 'oc_target', model({
  decision: 'record', intent: 'delete', evidence: '请删除', suggested_text: null,
}));
assert.equal(acceptedDeletion.state, 'record');
assert.deepEqual(toBaseFields(acceptedDeletion.item)['类型'], ['删除']);

const otherRequest = { ...base, message_id: 'om_other', content: '这个话术请补充适用场景标签' };
const acceptedOther = await analyzeMessage(otherRequest, 'oc_target', model({
  decision: 'record', intent: 'other', evidence: '补充适用场景标签', suggested_text: null,
}));
assert.equal(acceptedOther.state, 'record');
assert.deepEqual(toBaseFields(acceptedOther.item)['类型'], ['其他']);
assert.equal((await analyzeMessage(otherRequest, 'oc_target', model({
  decision: 'record', intent: 'unclear', evidence: '适用场景', suggested_text: null,
}))).state, 'review');

const post = { ...base, message_id: 'om_post', message_type: 'post',
  content: '老师，这个话术能否优化一下？\n![Image](img_v3_example)' };
assert.equal(normalizeMessageContent(post), '老师，这个话术能否优化一下？');
assert.equal(hasMessageImages(post), true);
const acceptedPost = await analyzeMessage(post, 'oc_target', model(good));
assert.equal(acceptedPost.state, 'record');
assert.equal(acceptedPost.item.messageType, 'post');
assert.equal(acceptedPost.item.hasImages, true);
assert.equal(acceptedPost.item.originalMessage, '老师，这个话术能否优化一下？');

let called = false;
assert.equal(await analyzeMessage(base, 'oc_other', async () => { called = true; }), null);
assert.equal(called, false);
assert.equal(await analyzeMessage({ ...base, content: '今天测试环境有问题' },
  'oc_target', model({ decision: 'ignore', intent: 'other', evidence: '', suggested_text: null })), null);

const negated = { ...base, content: '这个话术不要改成“您好，欢迎使用AI销售”' };
assert.equal((await analyzeMessage(negated, 'oc_target', model({
  decision: 'record', intent: 'optimize', evidence: '改成',
  suggested_text: '您好，欢迎使用AI销售',
}))).state, 'review');

const proposed = { ...base, content: '这个直播课话术建议优化一下' };
assert.equal((await analyzeMessage(proposed, 'oc_target', model({
  decision: 'record', intent: 'optimize', evidence: '建议优化',
  suggested_text: '直播课话术优化',
}))).item.suggestedText, '直播课话术优化');
assert.equal((await analyzeMessage(proposed, 'oc_target', model({
  decision: 'record', intent: 'optimize', evidence: '建议优化',
  suggested_text: '直播课话术删除',
}))).state, 'review');

const fallback = await analyzeMessage(base, 'oc_target', async () => { throw new Error('timeout'); });
assert.equal(fallback.state, 'record');
assert.equal(fallback.source, 'regex');
assert.equal(fallback.item.suggestedText, '');
assert.deepEqual(toBaseFields((await analyzeMessage(deletion, 'oc_target', async () => {
  throw new Error('timeout');
})).item)['类型'], ['删除']);
const negatedDeletion = { ...base, content: '这个话术不要删除，继续保留' };
assert.equal((await analyzeMessage(negatedDeletion, 'oc_target', async () => {
  throw new Error('timeout');
})).state, 'review');
assert.equal((await analyzeMessage(negated, 'oc_target', async () => {
  throw new Error('timeout');
})).state, 'review');
const noOptimization = { ...base, content: '这个话术建议不优化，保持原样' };
assert.equal((await analyzeMessage(noOptimization, 'oc_target', model({
  decision: 'record', intent: 'optimize', evidence: '建议不优化', suggested_text: null,
}))).state, 'review');
assert.equal((await analyzeMessage(noOptimization, 'oc_target', async () => {
  throw new Error('timeout');
})).state, 'review');
const opposed = { ...base, content: '这个话术不是要优化，请保持原样' };
assert.equal((await analyzeMessage(opposed, 'oc_target', model({
  decision: 'record', intent: 'optimize', evidence: '要优化', suggested_text: null,
}))).state, 'review');

let request, requestUrl;
const fakeFetch = async (url, options) => {
  requestUrl = url;
  request = JSON.parse(options.body);
  return { ok: true, json: async () => ({ status: 'completed', output: [
    { content: [{ type: 'output_text', text: JSON.stringify(good) }] },
  ] }) };
};
assert.deepEqual(await classifyWithOpenAI(base.content, {
  env: {}, config: {
    baseUrl: 'https://nai.xuelilaoshi.cn/v1', apiKey: 'test-only',
    model: 'deepseek-flash', responseFormat: 'json_schema', timeoutMs: 12000,
  }, fetcher: fakeFetch,
}), good);
assert.equal(requestUrl, 'https://nai.xuelilaoshi.cn/v1/responses');
assert.equal(request.model, 'deepseek-flash');
assert.equal(request.text.format.strict, true);
assert.match(request.instructions, /已确认由销售人员发送/);
assert.match(request.instructions, /不一定写出“话术”二字/);
assert.match(request.instructions, /最多12个字符/);
assert.match(request.instructions, /主题\+话术\+动作/);
assert.match(request.instructions, /decision 只决定处理去向/);
assert.match(request.instructions, /intent 只决定入库类型/);
assert.equal(request.max_output_tokens, 250);
assert.equal(request.store, false);
assert.equal(responsesEndpoint('https://example.com'), 'https://example.com/v1/responses');
assert.equal(responsesEndpoint('https://example.com/v1/'), 'https://example.com/v1/responses');
assert.equal(llmConfigured({}, { baseUrl: 'https://example.com/v1', model: 'm', apiKey: '' }), false);
console.log('analyzer tests passed');

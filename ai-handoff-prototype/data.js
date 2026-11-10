'use strict';

const businessNames = ['一转销售', '复洗AI客服', '复洗AI销售', '雪梨智学'];
const scenarios = [
  {
    key: 'agent_request', category: '账号权限', intent: 'activation_status',
    description: '客户反馈学习账号激活后仍无法使用，需要人工核对订单。',
    question: '课程显示未激活怎么办？',
    answer: '请先确认使用购课账号登录。若课程仍未显示，可以提供脱敏的订单编号供客服核对。',
    next: '请客户重新登录并确认课程状态，如仍异常则继续人工跟进。',
    messages: [
      ['客户', '老师好，想问一下课程怎么激活？'],
      ['AI', '您好，可以先用购课时的账号登录，然后在个人中心查看课程。'],
      ['客户', '登录了，还是显示没有激活。'],
      ['人工', '我帮您核对一下订单的激活状态。'],
      ['人工', '核对完成，请用购课账号重新登录试一下。'],
      ['客户', '好的，我再试一下。'],
      ['人工', '[表情]']
    ]
  },
  {
    key: 'knowledge_support', category: '学习指导', intent: 'learning_plan',
    description: '客户询问学习计划和教材选择，需要人工补充指导。',
    question: '如何给孩子安排每日单词练习？',
    answer: '在学习计划里选择对应的年级和教材，每天安排少量新词，并复习前一天的内容。',
    next: '确认教材版本后，给客户发一份学习计划示例。',
    messages: [
      ['客户', '想问一下怎么设置学习计划？'],
      ['AI', '您好，可以根据目前的学习进度选择教材。'],
      ['AI', '您可以先告诉我孩子的年级和希望练习的内容。'],
      ['客户', '四年级，想加强单词和阅读。'],
      ['人工', '可以先从课本同步的单词开始，设置每天的复习任务。']
    ]
  },
  {
    key: 'customer_refusal', category: '客户异议', intent: 'cancel_request',
    description: '客户表示暂时不需要课程，希望了解订单处理流程。',
    question: '暂时不想继续学习，怎么处理订单？',
    answer: '您可以在购课平台的订单详情里查看可用的售后选项，有问题可以继续联系老师。',
    next: '确认客户已找到订单入口，按平台提示完成操作。',
    messages: [
      ['AI', '您好，今天的课程安排可以在学习主页查看。'],
      ['客户', '最近没有时间学习。'],
      ['客户', '可以先处理一下订单吗？'],
      ['人工', '您可以在订单详情里查看售后入口，需要帮助的话可以给我留言。']
    ]
  }
];

const nicknames = ['晨光', '云朵', '小满', '橙子妈妈', '晴空', '小海星', '山茶', '薄荷', '星河', '蓝鲸', '月白', '小风铃', '初夏', '青禾', '雨点', '向日葵', '远山', '白露', '柚子', '松果'];
const firstPageApproved = [3, 4, 5, 6, 7, 8, 9, 10, 11];
const formatTime = stamp => new Date(stamp + 8 * 3600000).toISOString().slice(0, 19).replace('T', ' ');
const records = [741, 28, 44, 31].flatMap((count, business) => Array.from({ length: count }, (_, index) => {
  const scenario = scenarios[index % 7 === 1 ? 1 : index % 7 === 6 ? 2 : 0];
  const stamp = Date.UTC(2026, 10, 10, 2, 37, 59) - index * (53 + business * 7) * 60000;
  const employee = (Math.floor(index / 2) % 8) + 1;
  const status = business === 0 && index >= 248 || business !== 0 && index % 9 === 8 ? '已忽略' :
    index < 20 && business === 0 ? (firstPageApproved.includes(index) ? '已通过' : '待审核') :
    index % 11 === 0 ? '待分析' : index % 3 === 0 ? '已通过' : '待审核';
  return {
    id: 'demo-' + (business + 1) + '-' + String(index + 1).padStart(4, '0'),
    customer: nicknames[index % nicknames.length] + (index >= 20 ? ' ' + (Math.floor(index / 20) + 1) : ''),
    business, employee: 'DemoSales' + String(employee).padStart(2, '0'),
    team: '销售团队 / 教辅' + 'DACB'[employee % 4] + '区 / 教辅' + employee + '组',
    start: formatTime(stamp), end: formatTime(stamp + 3900000),
    updated: formatTime(stamp + 3910000), requested: '',
    status, scenario, version: status === '待分析' ? 0 : 1,
    messages: scenario.messages.map(([role, body], number) => ({
      role, body, time: formatTime(stamp + (number - 2) * 70000)
    }))
  };
}));

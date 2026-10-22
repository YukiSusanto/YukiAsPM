const accounts = [
  { name: '361-杜亚敏-免费-202505-至今', id: 'WuBingBing01', initial: '杜', tone: 'warm' },
  { name: '19-殷丽娟-助理-202303-202305', id: 'YinLiJuan', initial: '殷', tone: 'purple' },
  { name: '194-朱春花-助理-202411-至今', id: 'LiaoZengZeng', initial: '朱', tone: 'mint' },
  { name: '176-张宁-免费-202410-至今', id: 'ZhangNing', initial: '张', tone: 'blue' },
  { name: '496-叶清林-免费-202507-至今', id: 'YeQingLin', initial: '叶', tone: 'warm' },
  { name: '577-凌嘉敏-免费-202601-至今', id: 'LingJiaMin', initial: '凌', tone: 'purple' },
  { name: '495-胡仁龙-免费-202507-至今', id: 'HuRenLong', initial: '胡', tone: 'gray' },
  { name: '79-廖增增-助理-202404-至今', id: 'QiChunRu', initial: '廖', tone: 'mint' },
  { name: '576-李春雨-免费-202601-至今', id: 'LiChunYu', initial: '李', tone: 'blue' },
  { name: '206-徐磊-助理-202411-至今', id: 'XuLei', initial: '徐', tone: 'gray' },
  { name: '135-徐佳莹-免费-202409-至今', id: 'Tian', initial: '徐', tone: 'warm' },
  { name: '11-蔡刘伟-助理-202012-202102', id: 'CaiLiuWei', initial: '蔡', tone: 'purple' },
  { name: '578-孙培杰-助理-202404-至今', id: 'SunPeiJie', initial: '孙', tone: 'mint' },
  { name: '611-朱瑞祥-免费-202606-至今', id: 'ZhuRuiXiang', initial: '朱', tone: 'blue' },
  { name: '550-游梦茜-助理-202511-至今', id: 'YouMengQian', initial: '游', tone: 'warm' },
];

const customers = [
  { name: '墨言（邮政）', preview: '四年级这个阶段挺关键的', time: '刚刚', initial: '墨', tone: 'warm', type: 'new', id: 'C-1001', account: '361-杜亚敏-免费-202505-至今' },
  { name: '🍜泡面公主👸🏻', preview: '都不太会，会认识字母吧', time: '刚刚', initial: '泡', tone: 'purple', type: 'new', id: 'C-1002', account: '361-杜亚敏-免费-202505-至今' },
  { name: '巩伟', preview: '有事随时喊我', time: '1 分钟前', initial: '巩', tone: 'gray', type: 'new', id: 'C-1003', account: '19-殷丽娟-助理-202303-202305' },
  { name: '真', preview: '宝贝家长，给您赠送的3天直播课', time: '3 分钟前', initial: '真', tone: 'blue', type: 'new', id: 'C-1004', account: '194-朱春花-助理-202411-至今' },
  { name: '恭喜恭喜', preview: '看完还找不到，您截个图给我', time: '5 分钟前', initial: '恭', tone: 'mint', type: 'new', id: 'C-1005', account: '176-张宁-免费-202410-至今' },
  { name: '袁兆腾', preview: '找到订单自行处理', time: '7 分钟前', initial: '袁', tone: 'gray', type: 'new', id: 'C-1006', account: '496-叶清林-免费-202507-至今' },
  { name: 'baby', preview: '接下来的学习规划和雪梨老师的直播', time: '8 分钟前', initial: 'B', tone: 'warm', type: 'old', id: 'C-1007', account: '577-凌嘉敏-免费-202601-至今' },
  { name: '🎀⃟何在王心ꦿ᭄᪲💞࿐', preview: '❤️【第一课】规划！3-15岁英语进阶攻略…', time: '12 分钟前', initial: '何', tone: 'purple', type: 'old', id: 'C-1008', account: '495-胡仁龙-免费-202507-至今' },
  { name: 'HLY', preview: '会生成计划', time: '12 分钟前', initial: 'H', tone: 'mint', type: 'old', id: 'C-1009', account: '79-廖增增-助理-202404-至今' },
  { name: '崔の林栀鹿', preview: '👌', time: '15 分钟前', initial: '崔', tone: 'blue', type: 'old', id: 'C-1010', account: '576-李春雨-免费-202601-至今' },
  { name: '丹', preview: '嗯嗯，没有实体教材哈‘', time: '16 分钟前', initial: '丹', tone: 'warm', type: 'old', id: 'C-1011', account: '206-徐磊-助理-202411-至今' },
  { name: '巧霞', preview: '❤️【第一课】规划！3-15岁英语进阶攻略…', time: '19 分钟前', initial: '巧', tone: 'purple', type: 'old', id: 'C-1012', account: '135-徐佳莹-免费-202409-至今' },
  { name: '亚静', preview: '您先忙', time: '23 分钟前', initial: '亚', tone: 'gray', type: 'old', id: 'C-1013', account: '11-蔡刘伟-助理-202012-202102' },
  { name: '大森', preview: '家长，给您赠送的3天直播课还没预约哈', time: '26 分钟前', initial: '森', tone: 'blue', type: 'old', id: 'C-1014', account: '578-孙培杰-助理-202404-至今' },
  { name: '海风吹来', preview: '宝贝家长，给您赠送的3天直播课会讲方法', time: '29 分钟前', initial: '海', tone: 'mint', type: 'old', id: 'C-1015', account: '611-朱瑞祥-免费-202606-至今' },
];

const conversations = {
  '墨言（邮政）': [
    { role: 'customer', label: '客户', time: '2026/10/21 18:06', text: '我已经添加了你，现在我们可以开始聊天了。' },
    { role: 'agent', label: 'APP', time: '2026/10/21 18:06', text: '🌈家长你好，感谢使用雪梨老师的APP【单词拼读王】\n\n1️⃣【下载并安装APP】\n应用商店搜索【单词拼读王】下载\n或点击链接：https://static.xueliyingyu.com/dcwH5_install/index.html\n\n2️⃣【APP激活】\n以购课手机号并采取验证码形式登录APP，即可正常使用~\n\n3️⃣【APP使用】\n安装登录app后，可以观看下方【app使用教程视频】了解哦~\n您留言孩子的【年级】和【所在地区使用的教材版本】，给您APP使用建议~' },
    { role: 'agent', label: 'APP', time: '2026/10/21 18:06', text: '[视频]' },
    { role: 'agent', label: 'AI', time: '2026/10/21 18:06', text: '家长好～我是接下来负责咱们孩子英语学习的班主任老师' },
    { role: 'agent', label: 'AI', time: '2026/10/21 18:07', text: '孩子目前上几年级啦，平时学英语主要是觉得哪里吃力，都可以跟我说～' },
    { role: 'agent', label: 'AI', time: '2026/10/21 18:07', text: '接下来的学习规划和雪梨老师的直播，都会根据孩子的情况安排～' },
    { role: 'agent', label: 'AI', time: '2026/10/21 18:16', text: '家长' },
    { role: 'agent', label: 'AI', time: '2026/10/21 18:16', text: '雪梨老师下周二到周四晚上七点有三天家长直播课' },
    { role: 'agent', label: 'AI', time: '2026/10/21 18:16', text: '讲3到15岁英语怎么进阶' },
    { role: 'agent', label: 'AI', time: '2026/10/21 18:17', text: '还有起步晚怎么快速提分' },
    { role: 'agent', label: 'AI', time: '2026/10/21 18:17', text: '这课是家长来听的\n不占孩子时间\n三天内容前后接着讲\n您提前安排一下连续来听哈' },
    { role: 'agent', label: 'AI', time: '2026/10/21 18:17', text: '❤️【第一课】规划！3-15岁英语进阶攻略，学霸养成5大神器-1027（下周二 晚上七点）：https://xl.shirleyclass.com/s/28DrFx3\n❤️【第二课】实操！1年搞定小学6年英语，起步晚也能快速提分-1028（下周三 晚上七点）：https://xl.shirleyclass.com/s/1boC84a\n❤️【第三课】英语全规划，零基础1年逆袭学霸-1029（下周四 晚上七点）：https://xl.shirleyclass.com/s/8bJJQu5' },
    { role: 'customer', label: '客户', time: '2026/10/21 18:18', text: '4年级小学生' },
    { role: 'agent', label: 'AI', time: '2026/10/21 18:19', text: '四年级这个阶段挺关键的', score: '0.72' },
  ],
};

let selectedCustomer = customers[0];
let accountPage = 1;
let customerPage = 1;
let customerFilter = 'new';
const accountPageTotal = 6;
const customerPageSize = 6;

const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const toast = (message) => { const node = $('#toast'); node.textContent = message; node.classList.add('show'); window.clearTimeout(toast.timer); toast.timer = window.setTimeout(() => node.classList.remove('show'), 1800); };
const formatLocalDate = (date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');

function avatarMarkup(item, large = false) {
  return `<span class="avatar ${item.tone || 'blue'} ${large ? 'avatar-large' : ''}">${escapeHtml(item.initial || item.name?.slice(0, 1) || '客')}</span>`;
}

function renderAccounts() {
  const query = $('#account-search').value.trim().toLowerCase();
  const result = accounts.filter((item) => `${item.name}${item.id}`.toLowerCase().includes(query));
  $('#account-list').innerHTML = result.map((item, index) => `<button class="account-item ${index === 0 ? 'active' : ''}" data-account="${escapeHtml(item.name)}">${avatarMarkup(item)}<span class="item-copy"><span class="item-title">${escapeHtml(item.name)}</span><span class="item-subtitle">${escapeHtml(item.id)}</span></span><span class="item-star icon icon-star"></span></button>`).join('') || '<div class="empty-state">没有找到匹配账号</div>';
  $('#account-page').textContent = `${accountPage} / ${accountPageTotal}`;
  $('#account-prev').disabled = accountPage <= 1;
  $('#account-next').disabled = accountPage >= accountPageTotal;
}

function renderCustomers() {
  const query = $('#customer-search').value.trim().toLowerCase();
  const result = customers.filter((item) => (customerFilter === 'all' || item.type === customerFilter) && `${item.name}${item.preview}${item.id}`.toLowerCase().includes(query));
  const pageTotal = Math.max(1, Math.ceil(result.length / customerPageSize));
  if (customerPage > pageTotal) customerPage = pageTotal;
  $('#customer-list').innerHTML = result.map((item) => `<button class="customer-item ${item.id === selectedCustomer.id ? 'active' : ''}" data-customer="${escapeHtml(item.id)}">${avatarMarkup(item)}<span class="item-copy"><span class="item-title">${escapeHtml(item.name)}</span><span class="item-subtitle">${escapeHtml(item.preview)} · ${escapeHtml(item.time)}</span></span><span class="item-star icon icon-star"></span></button>`).join('') || '<div class="empty-state">没有找到匹配客户</div>';
  $('#customer-page').textContent = `${customerPage} / ${pageTotal}`;
  $('#customer-prev').disabled = customerPage <= 1;
  $('#customer-next').disabled = customerPage >= pageTotal;
}

function renderConversation() {
  const avatarNode = $('#conversation-avatar');
  avatarNode.className = `avatar avatar-large ${selectedCustomer.tone}`;
  avatarNode.textContent = selectedCustomer.initial;
  $('#conversation-title').textContent = selectedCustomer.name;
  const search = $('#message-search').value.trim().toLowerCase();
  const source = conversations[selectedCustomer.name] || [
    { role: 'customer', label: '客户', time: '2026/10/21 18:06', text: selectedCustomer.preview },
    { role: 'agent', label: 'AI', time: '2026/10/21 18:07', text: '家长好～我是接下来负责咱们孩子英语学习的班主任老师' },
    { role: 'agent', label: 'AI', time: '2026/10/21 18:08', text: '接下来的学习规划和雪梨老师的直播，都会根据孩子的情况安排～' },
  ];
  const result = source.filter((message) => message.text.toLowerCase().includes(search));
  $('#messages').innerHTML = result.map((message) => `<article class="message-row ${message.role}">${avatarMarkup({ initial: message.role === 'customer' ? selectedCustomer.initial : 'AI', tone: message.role === 'customer' ? selectedCustomer.tone : 'blue' })}<div class="message-body"><div class="message-meta"><span>${escapeHtml(message.label)}</span><span>${escapeHtml(message.time)}</span></div><div class="message-bubble">${escapeHtml(message.text)}</div>${message.score ? `<span class="message-score">${escapeHtml(message.score)}</span>` : ''}</div></article>`).join('') || '<div class="empty-state">当前范围内没有匹配的聊天内容</div>';
  $('#message-page-label').textContent = `第 1 页 · 共 ${source.length} 条`;
  $('#message-count').textContent = `共 ${source.length} 条`;
}

function selectCustomer(id) {
  selectedCustomer = customers.find((item) => item.id === id) || selectedCustomer;
  renderCustomers();
  renderConversation();
}

document.addEventListener('click', (event) => {
  const rangeButton = event.target.closest('.quick-filter');
  if (rangeButton) {
    document.querySelectorAll('.quick-filter').forEach((button) => button.classList.remove('active'));
    rangeButton.classList.add('active');
    const today = new Date('2026-10-21T00:00:00');
    const start = new Date(today);
    if (rangeButton.dataset.range === 'yesterday') start.setDate(start.getDate() - 1);
    if (rangeButton.dataset.range === 'week') start.setDate(start.getDate() - 6);
    $('#start-date').value = formatLocalDate(start);
    $('#end-date').value = formatLocalDate(today);
    toast(`已切换至${rangeButton.textContent}`);
    return;
  }
  const customerFilterButton = event.target.closest('.customer-filter');
  if (customerFilterButton) {
    customerFilter = customerFilterButton.dataset.filter;
    document.querySelectorAll('.customer-filter').forEach((button) => button.classList.toggle('active', button === customerFilterButton));
    renderCustomers();
    return;
  }
  const customerButton = event.target.closest('.customer-item');
  if (customerButton) { selectCustomer(customerButton.dataset.customer); return; }
  const accountButton = event.target.closest('.account-item');
  if (accountButton) {
    document.querySelectorAll('.account-item').forEach((button) => button.classList.toggle('active', button === accountButton));
    toast(`已切换账号：${accountButton.dataset.account}`);
    return;
  }
  if (event.target.closest('#refresh-button')) {
    const node = $('#refresh-button');
    node.classList.add('is-loading');
    $('#refresh-state').textContent = '正在刷新…';
    window.setTimeout(() => { node.classList.remove('is-loading'); $('#refresh-state').textContent = '已是最新'; toast('数据刷新完成'); }, 650);
    return;
  }
  if (event.target.closest('#favorite-button')) {
    const button = $('#favorite-button');
    button.classList.toggle('is-favorite');
    $('#favorite-label').textContent = button.classList.contains('is-favorite') ? '已收藏' : '收藏';
    toast(button.classList.contains('is-favorite') ? '已收藏当前会话' : '已取消收藏');
  }
});

$('#account-search').addEventListener('input', renderAccounts);
$('#customer-search').addEventListener('input', renderCustomers);
$('#message-search').addEventListener('input', renderConversation);
$('#account-prev').addEventListener('click', () => { if (accountPage > 1) { accountPage -= 1; renderAccounts(); toast(`已切换至第 ${accountPage} 页账号`); } });
$('#account-next').addEventListener('click', () => { if (accountPage < accountPageTotal) { accountPage += 1; renderAccounts(); toast(`已切换至第 ${accountPage} 页账号`); } });
$('#customer-prev').addEventListener('click', () => { if (customerPage > 1) { customerPage -= 1; renderCustomers(); toast(`已切换至第 ${customerPage} 页客户`); } });
$('#customer-next').addEventListener('click', () => { const query = $('#customer-search').value.trim().toLowerCase(); const matching = customers.filter((item) => (customerFilter === 'all' || item.type === customerFilter) && `${item.name}${item.preview}${item.id}`.toLowerCase().includes(query)); const pageTotal = Math.max(1, Math.ceil(matching.length / customerPageSize)); if (customerPage < pageTotal) { customerPage += 1; renderCustomers(); toast(`已切换至第 ${customerPage} 页客户`); } });

renderAccounts();
renderCustomers();
renderConversation();

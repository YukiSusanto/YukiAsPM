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
  { name: '墨言（邮政）', preview: '四年级这个阶段挺关键的', time: '刚刚', initial: '墨', tone: 'warm', age: 'new', status: 'active', id: 'C-1001', account: '361-杜亚敏-免费-202505-至今' },
  { name: '🍜泡面公主👸🏻', preview: '都不太会，会认识字母吧', time: '刚刚', initial: '泡', tone: 'purple', age: 'new', status: 'active', id: 'C-1002', account: '361-杜亚敏-免费-202505-至今' },
  { name: '巩伟', preview: '有事随时喊我', time: '1 分钟前', initial: '巩', tone: 'gray', age: 'new', status: 'active', id: 'C-1003', account: '19-殷丽娟-助理-202303-202305' },
  { name: '真', preview: '宝贝家长，给您赠送的3天直播课', time: '3 分钟前', initial: '真', tone: 'blue', age: 'new', status: 'active', id: 'C-1004', account: '194-朱春花-助理-202411-至今' },
  { name: '恭喜恭喜', preview: '看完还找不到，您截个图给我', time: '5 分钟前', initial: '恭', tone: 'mint', age: 'new', status: 'active', id: 'C-1005', account: '176-张宁-免费-202410-至今' },
  { name: '袁兆腾', preview: '找到订单自行处理', time: '7 分钟前', initial: '袁', tone: 'gray', age: 'new', status: 'lost', id: 'C-1006', account: '496-叶清林-免费-202507-至今' },
  { name: 'baby', preview: '接下来的学习规划和雪梨老师的直播', time: '8 分钟前', initial: 'B', tone: 'warm', age: 'old', status: 'active', id: 'C-1007', account: '577-凌嘉敏-免费-202601-至今' },
  { name: '🎀⃟何在王心ꦿ᭄᪲💞࿐', preview: '❤️【第一课】规划！3-15岁英语进阶攻略…', time: '12 分钟前', initial: '何', tone: 'purple', age: 'old', status: 'lost', id: 'C-1008', account: '495-胡仁龙-免费-202507-至今' },
  { name: 'HLY', preview: '会生成计划', time: '12 分钟前', initial: 'H', tone: 'mint', age: 'old', status: 'active', id: 'C-1009', account: '79-廖增增-助理-202404-至今' },
  { name: '崔の林栀鹿', preview: '👌', time: '15 分钟前', initial: '崔', tone: 'blue', age: 'old', status: 'active', id: 'C-1010', account: '576-李春雨-免费-202601-至今' },
  { name: '丹', preview: '嗯嗯，没有实体教材哈', time: '16 分钟前', initial: '丹', tone: 'warm', age: 'old', status: 'active', id: 'C-1011', account: '206-徐磊-助理-202411-至今' },
  { name: '巧霞', preview: '❤️【第一课】规划！3-15岁英语进阶攻略…', time: '19 分钟前', initial: '巧', tone: 'purple', age: 'old', status: 'lost', id: 'C-1012', account: '135-徐佳莹-免费-202409-至今' },
  { name: '亚静', preview: '您先忙', time: '23 分钟前', initial: '亚', tone: 'gray', age: 'old', status: 'active', id: 'C-1013', account: '11-蔡刘伟-助理-202012-202102' },
  { name: '大森', preview: '家长，给您赠送的3天直播课还没预约哈', time: '26 分钟前', initial: '森', tone: 'blue', age: 'old', status: 'active', id: 'C-1014', account: '578-孙培杰-助理-202404-至今' },
  { name: '海风吹来', preview: '宝贝家长，给您赠送的3天直播课会讲方法', time: '29 分钟前', initial: '海', tone: 'mint', age: 'old', status: 'lost', id: 'C-1015', account: '611-朱瑞祥-免费-202606-至今' },
];

const groups = [
  { name: '四年级英语规划交流群', preview: '今晚直播课记得提前 10 分钟进入', time: '刚刚', initial: '群', tone: 'blue', status: 'active', id: 'G-2001' },
  { name: '自然拼读学习打卡群', preview: '今日打卡任务已经发布', time: '2 分钟前', initial: '拼', tone: 'mint', status: 'active', id: 'G-2002' },
  { name: '三天家长直播课 1027', preview: '课程资料已上传群文件', time: '8 分钟前', initial: '课', tone: 'warm', status: 'active', id: 'G-2003' },
  { name: '单词拼读王体验群', preview: '感谢各位家长参与体验', time: '1 小时前', initial: '词', tone: 'purple', status: 'dissolved', id: 'G-2004' },
  { name: '暑期英语启蒙训练营', preview: '本期训练营已结束', time: '3 天前', initial: '营', tone: 'gray', status: 'dissolved', id: 'G-2005' },
];

const customerTagGroups = [
  { id: 'trial-period', name: '体验课-用户标签', tags: ['140期', '139期', '138期', '137期', '136期', '135期', '134期', '133期'] },
  { id: 'group-status', name: '芝麻微客-在群状态', tags: ['【已退群】', '【未入群】', '【在群中】'] },
  { id: 'mantis-test', name: '螳螂测试-勿动', tags: ['螳螂测试 128 期-0906', '螳螂测试 128 期-0905', '螳螂测试 128 期-0904', '螳螂测试 128 期-0903'] },
  { id: 'ai-test', name: 'ai 测试-勿动', tags: ['ai135期-1025', 'ai135期-1024', 'ai135期-1023', 'ai135期-1022', 'ai135期-1021', 'ai135期-1020', 'ai135期-1019', 'ai134期-1018'] },
  { id: 'support-ai', name: '支援AI标签2', tags: ['测试线135期图书-1025', '测试线135期图书-1024', '测试线135期图书-1023', '测试线135期图书-1022', '测试线134期D3到课-1022', '测试线134期D2到课-1021', '测试线134期D1到课-1020'] },
  { id: 'attendance', name: '销转-大课营销到课标-CD区', tags: ['螳螂127期-图书线D3到课30min', '螳螂127期-图书线D2到课30min', '螳螂127期-图书线D1到课30min', '螳螂127期-图书线D3已点链接', '螳螂127期-图书线D2已点链接', '螳螂127期-图书线D1已点链接', '螳螂127期-图书线D3已到课', '螳螂127期-图书线D2已到课', '螳螂127期-图书线D1已到课'] },
];

const customerTagAssignments = {
  'C-1001': ['trial-period::140期', 'group-status::【在群中】', 'ai-test::ai135期-1025', 'attendance::螳螂127期-图书线D1已到课'],
  'C-1002': ['trial-period::140期', 'group-status::【未入群】', 'support-ai::测试线135期图书-1025'],
  'C-1003': ['trial-period::139期', 'group-status::【在群中】', 'ai-test::ai135期-1024'],
  'C-1004': ['trial-period::139期', 'group-status::【已退群】', 'attendance::螳螂127期-图书线D2已点链接'],
  'C-1005': ['trial-period::138期', 'group-status::【在群中】', 'support-ai::测试线135期图书-1024'],
  'C-1006': ['trial-period::138期', 'group-status::【已退群】', 'mantis-test::螳螂测试 128 期-0906'],
  'C-1007': ['trial-period::137期', 'group-status::【未入群】', 'ai-test::ai135期-1023'],
  'C-1008': ['trial-period::137期', 'group-status::【在群中】', 'attendance::螳螂127期-图书线D3到课30min'],
  'C-1009': ['trial-period::136期', 'group-status::【在群中】', 'support-ai::测试线135期图书-1023'],
  'C-1010': ['trial-period::136期', 'group-status::【未入群】', 'mantis-test::螳螂测试 128 期-0905'],
  'C-1011': ['trial-period::135期', 'group-status::【已退群】', 'ai-test::ai135期-1022'],
  'C-1012': ['trial-period::135期', 'group-status::【在群中】', 'support-ai::测试线134期D3到课-1022'],
  'C-1013': ['trial-period::134期', 'group-status::【未入群】', 'attendance::螳螂127期-图书线D2到课30min'],
  'C-1014': ['trial-period::134期', 'group-status::【在群中】', 'ai-test::ai135期-1021'],
  'C-1015': ['trial-period::133期', 'group-status::【已退群】', 'support-ai::测试线134期D2到课-1021'],
};

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
  '四年级英语规划交流群': [
    { role: 'customer', label: '群成员', time: '2026/10/21 18:01', text: '老师，今晚的直播还是七点开始吗？' },
    { role: 'agent', label: 'AI', time: '2026/10/21 18:02', text: '是的，今晚七点准时开始，建议各位家长提前 10 分钟进入直播间～' },
    { role: 'customer', label: '群成员', time: '2026/10/21 18:04', text: '好的，已经设置提醒了。' },
    { role: 'agent', label: '群公告', time: '2026/10/21 18:05', text: '【今晚直播提醒】课程将在 19:00 开始，直播链接：https://xl.shirleyclass.com/s/demo' },
  ],
};

let contactKind = 'customer';
let contactStatus = 'all';
let customerAge = 'new';
let selectedContact = customers[0];
let selectedCustomerTags = new Set();
let draftCustomerTags = new Set();
let activeTagGroupId = customerTagGroups[0].id;
let accountPage = 1;
let customerPage = 1;
const accountPageTotal = 6;
const customerPageSize = 6;

const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const toast = (message) => { const node = $('#toast'); node.textContent = message; node.classList.add('show'); window.clearTimeout(toast.timer); toast.timer = window.setTimeout(() => node.classList.remove('show'), 1800); };
const formatLocalDate = (date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
const tagKey = (groupId, tag) => `${groupId}::${tag}`;

function getSelectedTagDetails(selection) {
  return customerTagGroups.flatMap((group) => group.tags
    .filter((tag) => selection.has(tagKey(group.id, tag)))
    .map((tag) => ({ key: tagKey(group.id, tag), group: group.name, tag })));
}

function renderTagTrigger() {
  const selected = getSelectedTagDetails(selectedCustomerTags);
  const visible = selected.slice(0, 2);
  $('#tag-trigger-content').innerHTML = selected.length
    ? `${visible.map((item) => `<span class="tag-trigger-chip">${escapeHtml(item.tag)}</span>`).join('')}${selected.length > visible.length ? `<span class="tag-trigger-more">+${selected.length - visible.length}</span>` : ''}`
    : '<span class="tag-trigger-placeholder">请选择标签</span>';
  const tooltip = $('#tag-trigger-tooltip');
  tooltip.textContent = selected.map((item) => `${item.group}：${item.tag}`).join('；');
  tooltip.hidden = selected.length <= visible.length;
  $('#tag-filter-trigger').setAttribute('aria-label', selected.length ? `已选择 ${selected.length} 个客户标签` : '选择客户标签');
}

function renderSelectedTagSummary() {
  const selected = getSelectedTagDetails(draftCustomerTags);
  $('#tag-selected-list').innerHTML = selected.length
    ? selected.map((item) => `<span class="selected-tag-chip">${escapeHtml(item.tag)}<button data-remove-tag="${escapeHtml(item.key)}" aria-label="移除${escapeHtml(item.tag)}">×</button></span>`).join('')
    : '<span class="tag-selected-empty">暂未选择标签</span>';
}

function renderTagGroups() {
  const query = $('#tag-group-search').value.trim().toLowerCase();
  const matching = customerTagGroups.filter((group) => group.name.toLowerCase().includes(query));
  $('#tag-group-list').innerHTML = matching.map((group) => {
    const selectedCount = group.tags.filter((tag) => draftCustomerTags.has(tagKey(group.id, tag))).length;
    return `<button class="tag-group-button ${group.id === activeTagGroupId ? 'active' : ''}" data-tag-group="${group.id}"><span>${escapeHtml(group.name)}</span><span class="tag-group-count">${selectedCount}/${group.tags.length}</span></button>`;
  }).join('') || '<div class="empty-state">没有匹配的标签组</div>';
}

function renderTagOptions() {
  const group = customerTagGroups.find((item) => item.id === activeTagGroupId) || customerTagGroups[0];
  const query = $('#tag-name-search').value.trim().toLowerCase();
  const tags = group.tags.filter((tag) => tag.toLowerCase().includes(query));
  const selectedCount = group.tags.filter((tag) => draftCustomerTags.has(tagKey(group.id, tag))).length;
  $('#tag-option-title').textContent = group.name;
  $('#tag-select-all').textContent = selectedCount === group.tags.length ? '取消全选' : '全选';
  $('#tag-option-list').innerHTML = tags.map((tag) => {
    const key = tagKey(group.id, tag);
    const selected = draftCustomerTags.has(key);
    return `<button class="tag-option-button ${selected ? 'selected' : ''}" data-tag-key="${escapeHtml(key)}" aria-pressed="${selected}"><span class="tag-checkbox">✓</span><span>${escapeHtml(tag)}</span></button>`;
  }).join('') || '<div class="empty-state">没有匹配的标签</div>';
}

function renderTagDialog() {
  renderSelectedTagSummary();
  renderTagGroups();
  renderTagOptions();
}

function openTagDialog() {
  draftCustomerTags = new Set(selectedCustomerTags);
  activeTagGroupId = customerTagGroups[0].id;
  $('#tag-group-search').value = '';
  $('#tag-name-search').value = '';
  renderTagDialog();
  $('#tag-filter-overlay').hidden = false;
  window.requestAnimationFrame(() => $('#tag-group-search').focus());
}

function closeTagDialog(commit = false) {
  if (commit) {
    selectedCustomerTags = new Set(draftCustomerTags);
    renderTagTrigger();
    customerPage = 1;
    renderCustomers();
    renderConversation();
    toast(selectedCustomerTags.size ? `已选择 ${selectedCustomerTags.size} 个客户标签` : '已清空客户标签');
  }
  $('#tag-filter-overlay').hidden = true;
  $('#tag-filter-trigger').focus();
}

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

function matchesSelectedCustomerTags(customer) {
  if (!selectedCustomerTags.size) return true;
  const assigned = customerTagAssignments[customer.id] || [];
  return customerTagGroups.every((group) => {
    const selectedInGroup = group.tags.map((tag) => tagKey(group.id, tag)).filter((key) => selectedCustomerTags.has(key));
    return !selectedInGroup.length || selectedInGroup.some((key) => assigned.includes(key));
  });
}

function getFilteredContacts() {
  const query = $('#customer-search').value.trim().toLowerCase();
  const source = contactKind === 'customer' ? customers : groups;
  return source.filter((item) => {
    const matchesKindFilter = contactKind === 'customer'
      ? item.age === customerAge && (contactStatus === 'all' || item.status === contactStatus)
      : contactStatus === 'all' || item.status === contactStatus;
    const matchesTags = contactKind !== 'customer' || matchesSelectedCustomerTags(item);
    return matchesKindFilter && matchesTags && `${item.name}${item.preview}${item.id}`.toLowerCase().includes(query);
  });
}

function renderContactControls() {
  const isCustomer = contactKind === 'customer';
  $('#age-filter').classList.toggle('is-hidden', !isCustomer);
  $('#tag-filter').classList.toggle('is-hidden', !isCustomer);
  $('#contact-count').textContent = isCustomer ? '客户数：67' : '群聊数：12';
  $('#customer-search').placeholder = isCustomer ? '搜索客户名称或ID' : '搜索群聊名称或ID';
  document.querySelectorAll('.contact-kind-tab').forEach((button) => {
    const active = button.dataset.kind === contactKind;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  const filters = isCustomer
    ? [{ value: 'all', label: '全部' }, { value: 'active', label: '未流失' }, { value: 'lost', label: '已流失' }]
    : [{ value: 'all', label: '全部' }, { value: 'dissolved', label: '已解散' }];
  $('#contact-status-filters').setAttribute('aria-label', isCustomer ? '客户状态' : '群聊状态');
  $('#contact-status-filters').innerHTML = filters.map((filter) => `<button class="contact-status-filter ${filter.value === contactStatus ? 'active' : ''}" role="tab" aria-selected="${filter.value === contactStatus}" data-status="${filter.value}">${filter.label}</button>`).join('');
}

function renderCustomers() {
  const result = getFilteredContacts();
  const pageTotal = Math.max(1, Math.ceil(result.length / customerPageSize));
  if (customerPage > pageTotal) customerPage = pageTotal;
  if (!result.some((item) => item.id === selectedContact.id) && result.length) selectedContact = result[0];
  $('#customer-list').innerHTML = result.map((item) => {
    const statusText = contactKind === 'group' && item.status === 'dissolved' ? ' · 已解散' : '';
    return `<button class="customer-item ${item.id === selectedContact.id ? 'active' : ''}" data-contact="${escapeHtml(item.id)}">${avatarMarkup(item)}<span class="item-copy"><span class="item-title">${escapeHtml(item.name)}</span><span class="item-subtitle">${escapeHtml(item.preview)}${statusText} · ${escapeHtml(item.time)}</span></span><span class="item-star icon icon-star"></span></button>`;
  }).join('') || `<div class="empty-state">没有找到匹配${contactKind === 'customer' ? '客户' : '群聊'}</div>`;
  $('#customer-page').textContent = `${customerPage} / ${pageTotal}`;
  $('#customer-prev').disabled = customerPage <= 1;
  $('#customer-next').disabled = customerPage >= pageTotal;
  $('#customer-prev').setAttribute('aria-label', `上一页${contactKind === 'customer' ? '客户' : '群聊'}`);
  $('#customer-next').setAttribute('aria-label', `下一页${contactKind === 'customer' ? '客户' : '群聊'}`);
}

function renderConversation() {
  const avatarNode = $('#conversation-avatar');
  avatarNode.className = `avatar avatar-large ${selectedContact.tone}`;
  avatarNode.textContent = selectedContact.initial;
  $('#conversation-title').textContent = selectedContact.name;
  const search = $('#message-search').value.trim().toLowerCase();
  const source = conversations[selectedContact.name] || [
    { role: 'customer', label: contactKind === 'customer' ? '客户' : '群成员', time: '2026/10/21 18:06', text: selectedContact.preview },
    { role: 'agent', label: 'AI', time: '2026/10/21 18:07', text: '家长好～我是接下来负责咱们孩子英语学习的班主任老师' },
    { role: 'agent', label: 'AI', time: '2026/10/21 18:08', text: '接下来的学习规划和雪梨老师的直播，都会根据孩子的情况安排～' },
  ];
  const result = source.filter((message) => message.text.toLowerCase().includes(search));
  $('#messages').innerHTML = result.map((message) => `<article class="message-row ${message.role}">${avatarMarkup({ initial: message.role === 'customer' ? selectedContact.initial : 'AI', tone: message.role === 'customer' ? selectedContact.tone : 'blue' })}<div class="message-body"><div class="message-meta"><span>${escapeHtml(message.label)}</span><span>${escapeHtml(message.time)}</span></div><div class="message-bubble">${escapeHtml(message.text)}</div>${message.score ? `<span class="message-score">${escapeHtml(message.score)}</span>` : ''}</div></article>`).join('') || '<div class="empty-state">当前范围内没有匹配的聊天内容</div>';
  $('#message-page-label').textContent = `第 1 页 · 共 ${source.length} 条`;
  $('#message-count').textContent = `共 ${source.length} 条`;
}

function selectContact(id) {
  const source = contactKind === 'customer' ? customers : groups;
  selectedContact = source.find((item) => item.id === id) || selectedContact;
  renderCustomers();
  renderConversation();
}

function refreshContactView() {
  renderContactControls();
  renderCustomers();
  renderConversation();
}

document.addEventListener('click', (event) => {
  if (event.target.closest('#tag-filter-trigger')) {
    openTagDialog();
    return;
  }
  if (event.target.closest('#tag-dialog-close') || event.target.closest('#tag-dialog-cancel')) {
    closeTagDialog(false);
    return;
  }
  if (event.target.closest('#tag-dialog-confirm')) {
    closeTagDialog(true);
    return;
  }
  if (event.target === $('#tag-filter-overlay')) {
    closeTagDialog(false);
    return;
  }
  const tagGroupButton = event.target.closest('.tag-group-button');
  if (tagGroupButton) {
    activeTagGroupId = tagGroupButton.dataset.tagGroup;
    $('#tag-name-search').value = '';
    renderTagGroups();
    renderTagOptions();
    return;
  }
  if (event.target.closest('#tag-select-all')) {
    const group = customerTagGroups.find((item) => item.id === activeTagGroupId) || customerTagGroups[0];
    const allSelected = group.tags.every((tag) => draftCustomerTags.has(tagKey(group.id, tag)));
    group.tags.forEach((tag) => {
      const key = tagKey(group.id, tag);
      if (allSelected) draftCustomerTags.delete(key); else draftCustomerTags.add(key);
    });
    renderTagDialog();
    return;
  }
  const tagOptionButton = event.target.closest('.tag-option-button');
  if (tagOptionButton) {
    const key = tagOptionButton.dataset.tagKey;
    if (draftCustomerTags.has(key)) draftCustomerTags.delete(key); else draftCustomerTags.add(key);
    renderTagDialog();
    return;
  }
  const removeTagButton = event.target.closest('[data-remove-tag]');
  if (removeTagButton) {
    draftCustomerTags.delete(removeTagButton.dataset.removeTag);
    renderTagDialog();
    return;
  }
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
  const contactKindButton = event.target.closest('.contact-kind-tab');
  if (contactKindButton) {
    contactKind = contactKindButton.dataset.kind;
    contactStatus = 'all';
    customerPage = 1;
    $('#customer-search').value = '';
    selectedContact = (contactKind === 'customer' ? customers : groups)[0];
    refreshContactView();
    toast(`已切换至${contactKind === 'customer' ? '客户' : '群聊'}`);
    return;
  }
  const ageFilterButton = event.target.closest('.age-filter-button');
  if (ageFilterButton) {
    customerAge = ageFilterButton.dataset.age;
    customerPage = 1;
    document.querySelectorAll('.age-filter-button').forEach((button) => {
      const active = button === ageFilterButton;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    renderCustomers();
    renderConversation();
    toast(`已筛选${ageFilterButton.textContent}`);
    return;
  }
  const statusFilterButton = event.target.closest('.contact-status-filter');
  if (statusFilterButton) {
    contactStatus = statusFilterButton.dataset.status;
    customerPage = 1;
    renderContactControls();
    renderCustomers();
    renderConversation();
    return;
  }
  const customerButton = event.target.closest('.customer-item');
  if (customerButton) { selectContact(customerButton.dataset.contact); return; }
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
$('#customer-search').addEventListener('input', () => { customerPage = 1; renderCustomers(); renderConversation(); });
$('#message-search').addEventListener('input', renderConversation);
$('#tag-group-search').addEventListener('input', renderTagGroups);
$('#tag-name-search').addEventListener('input', renderTagOptions);
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !$('#tag-filter-overlay').hidden) closeTagDialog(false); });
$('#account-prev').addEventListener('click', () => { if (accountPage > 1) { accountPage -= 1; renderAccounts(); toast(`已切换至第 ${accountPage} 页账号`); } });
$('#account-next').addEventListener('click', () => { if (accountPage < accountPageTotal) { accountPage += 1; renderAccounts(); toast(`已切换至第 ${accountPage} 页账号`); } });
$('#customer-prev').addEventListener('click', () => { if (customerPage > 1) { customerPage -= 1; renderCustomers(); toast(`已切换至第 ${customerPage} 页${contactKind === 'customer' ? '客户' : '群聊'}`); } });
$('#customer-next').addEventListener('click', () => { const pageTotal = Math.max(1, Math.ceil(getFilteredContacts().length / customerPageSize)); if (customerPage < pageTotal) { customerPage += 1; renderCustomers(); toast(`已切换至第 ${customerPage} 页${contactKind === 'customer' ? '客户' : '群聊'}`); } });

renderAccounts();
renderTagTrigger();
refreshContactView();

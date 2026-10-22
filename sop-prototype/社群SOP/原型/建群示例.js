/* 建群动作示例：在演示数据里预置一条「建群」消息节点，便于直接看到建群配置与任务发送情况里的群聊记录。
   仅在当前SOP还没有建群节点时补一条，不覆盖已有配置。 */
(function seedCreateGroupExample() {
  if (typeof state === 'undefined' || !Array.isArray(state) || !state.length) return;
  const hasCreate = state.some(g => (g.nodes || []).some(n => n && n.action === 'create_group'));
  if (hasCreate) return;
  const target = state[0];
  if (!target || !Array.isArray(target.nodes)) return;
  const sampleTime = '12:00';
  const occupied = target.nodes.some(n => String(n.time) === sampleTime);
  target.nodes.push({
    id: 'demo-create-group-node',
    time: occupied ? '12:30' : sampleTime,
    action: 'create_group',
    include: [],
    includeLogic: 'or',
    exclude: [],
    excludeLogic: 'or',
    friendStart: '',
    friendEnd: '',
    text: '',
    note: '演示节点：按客户的产品线标签自动建群并拉人（静默动作，无话术与素材）',
    materials: [],
    materialCount: 0,
    liveSession: 1,
    relativeMode: 'after',
    offset: 0
  });
  /* 建群清单按演示客户空间实时算一份，保证编辑弹窗与任务发送情况里的拉群人数一致 */
  const created = target.nodes[target.nodes.length - 1];
  if (typeof communityBuildStats === 'function') {
    try {
      const stats = communityBuildStats(created);
      if (stats.groups.length) {
        created.buildGroups = stats.groups.map(g => ({ product: g.product, name: g.name, count: g.count }));
        created.buildMatched = stats.matched;
      }
    } catch (e) { /* 忽略：保留空清单，编辑时再算 */ }
  }
  if (typeof persist === 'function') persist();
})();

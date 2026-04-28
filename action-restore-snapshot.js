const proxmoxApi = require("proxmox-api").default;

module.exports = (modcfg) => ({
  requireRow: true,
  configFields: async ({ table }) => {
    return [
      {
        name: "start",
        label: "Start VM after restore",
        type: "Bool",
      },
    ];
  },

  run: async ({ table, row, configuration: { start }, req, user }) => {
    const proxmox = proxmoxApi({
      host: modcfg.host,
      password: modcfg.password,
      username: modcfg.username,
    });

    const params = {};
    if (start) params.start = 1;
    await proxmox.nodes
      .$(row.node)
      .qemu.$(row.vmid)
      .snapshot.$(row.name)
      .rollback.$post(params);
  },
});

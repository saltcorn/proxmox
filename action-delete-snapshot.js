const proxmoxApi = require("proxmox-api").default;

module.exports = (modcfg) => ({
  requireRow: true,
  configFields: async ({ table }) => {
    return [
      {
        name: "force",
        label: "Force delete",
        type: "Bool",
      },
    ];
  },

  run: async ({ table, row, configuration: { force }, req, user }) => {
    const proxmox = proxmoxApi({
      host: modcfg.host,
      password: modcfg.password,
      username: modcfg.username,
    });

    const params = {};
    if (force) params.force = true;
    const result = await proxmox.nodes
      .$(row.node)
      .qemu.$(row.vmid)
      .snapshot.$(row.name)
      .$delete(params);
    console.log(result);
  },
});

const proxmoxApi = require("proxmox-api").default;

module.exports = (modcfg) => ({
  requireRow: true,
  configFields: async ({ table }) => {
    return [
      {
        name: "snapname",
        label: "Snapshot name",
        type: "String",
        required: true,
      },
      {
        name: "description",
        label: "Description",
        type: "String",
      },
      {
        name: "vmstate",
        label: "Include RAM state",
        type: "Bool",
      },
    ];
  },

  run: async ({
    table,
    row,
    configuration: { snapname, description, vmstate },
    req,
    user,
  }) => {
    const proxmox = proxmoxApi({
      host: modcfg.host,
      password: modcfg.password,
      username: modcfg.username,
    });

    const nodes = await proxmox.nodes.$get();
    for (const node of nodes) {
      if (node.id === row.node) {
        const theNode = proxmox.nodes.$(node.node);
        const qemus = await theNode.qemu.$get();
        for (const qemu of qemus) {
          if (qemu.vmid === row.vmid) {
            const params = { snapname };
            if (description) params.description = description;
            if (vmstate) params.vmstate = true;
            const result = await theNode.qemu
              .$(qemu.vmid)
              .snapshot.$post(params);
            console.log(result);
            return;
          }
        }
        return;
      }
    }
  },
});

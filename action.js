const db = require("@saltcorn/data/db");
const Table = require("@saltcorn/data/models/table");
const File = require("@saltcorn/data/models/file");
const User = require("@saltcorn/data/models/user");
const Crash = require("@saltcorn/data/models/crash");
const Trigger = require("@saltcorn/data/models/trigger");
const Plugin = require("@saltcorn/data/models/plugin");
const { getState } = require("@saltcorn/data/db/state");
const { eval_expression } = require("@saltcorn/data/models/expression");
const proxmoxApi = require("proxmox-api").default;

const status_actions = [
  "reboot",
  "reset",
  "resume",
  "shutdown",
  "start",
  "stop",
  "suspend",
];

module.exports = (modcfg) => ({
  requireRow: true,
  configFields: async ({ table }) => {
    return [
      {
        name: "action",
        label: "Action",
        type: "String",
        required: true,
        attributes: {
          options: status_actions,
        },
      },
    ];
  },

  run: async ({ table, row, configuration: { action }, req, user }) => {
    const proxmox = proxmoxApi({
      host: modcfg.host,
      password: modcfg.password,
      username: modcfg.username,
    });

    //assume this is a qemu for now
    const nodes = await proxmox.nodes.$get();
    for (const node of nodes) {
      if (node.id === row.node) {
        const theNode = proxmox.nodes.$(node.node);
        // list Qemu VMS
        const qemus = await theNode.qemu.$get({ full: true });
        for (const qemu of qemus) {
          if (qemu.vmid === row.vmid) {
            //const result = await theNode.qemu.$(qemu.vmid)["$" + method](props);
            const result = await theNode.qemu
              .$(qemu.vmid)
              .status[action].$post();
            console.log(result);

            break;
          }
        }
        break;
      }
    }
  },
});

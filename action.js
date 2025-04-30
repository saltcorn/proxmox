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

module.exports = (modcfg) => ({
  requireRow: true,
  configFields: async ({ table }) => {
    return [
      {
        name: "method",
        label: "Method",
        type: "String",
        required: true,
        attributes: {
          options: ["POST", "PUT", "DELETE"],
        },
      },
      {
        name: "properties",
        label: "Properties",
        sublabel: "JavaScript object",
        type: "String",
        fieldview: "textarea",
      },
    ];
  },

  run: async ({ table, row, configuration, req, user }) => {
    const { method, properties } = configuration;
    const proxmox = proxmoxApi({
      host: modcfg.host,
      password: modcfg.password,
      username: modcfg.username,
    });
    const props = eval_expression(
      properties || "{}",
      row || {},
      user,
      "proxmox_modify properties"
    );
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
            const result = await theNode.qemu.$(qemu.vmid).status.suspend.$post()
            console.log(result);

            break;
          }
        }
        break;
      }
    }
  },
});

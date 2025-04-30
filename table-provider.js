const db = require("@saltcorn/data/db");
const { eval_expression } = require("@saltcorn/data/models/expression");
const Workflow = require("@saltcorn/data/models/workflow");
const Form = require("@saltcorn/data/models/form");
const FieldRepeat = require("@saltcorn/data/models/fieldrepeat");
const Field = require("@saltcorn/data/models/field");
const Table = require("@saltcorn/data/models/table");
const { getState } = require("@saltcorn/data/db/state");
const fetch = require("node-fetch");
const proxmoxApi = require("proxmox-api").default;

const configuration_workflow = (cfg) => (req) =>
  new Workflow({
    steps: [
      {
        name: "Entities",
        form: async () => {
          return new Form({
            fields: [
              {
                type: "String",
                name: "entity_type",
                label: "Entity type",
                required: true,
                attributes: { options: ["Nodes"] },
              },
            ],
          });
        },
      },
    ],
  });

const runQuery = async (cfg, where, opts) => {
  console.log(proxmoxApi);

  const proxmox = proxmoxApi({
    host: cfg.host,
    password: cfg.password,
    username: cfg.username,
  });
  // list nodes
  switch (cfg.entity_type) {
    case "Nodes":
      const nodes = await proxmox.nodes.$get();
      return nodes;

    default:
      break;
  }
};

module.exports = (modcfg) => ({
  Proxmox: {
    configuration_workflow: configuration_workflow(modcfg),
    fields: (cfgTable) => {
      switch (cfgTable.entity_type) {
        case "Nodes":
          return [
            { name: "id", type: "String", label: "ID", primary_key: true },
            { name: "status", type: "String", label: "Status" },
            { name: "node", type: "String", label: "Node" },
            { name: "level", type: "String", label: "Level" },
            { name: "ssl_fingerprint", type: "String", label: "SSL fingerprint" },
            { name: "disk", type: "Integer", label: "Disk" },
            { name: "maxdisk", type: "Integer", label: "Maximum Disk" },
            { name: "mem", type: "Integer", label: "Memory" },
            { name: "maxmem", type: "Integer", label: "Maximum Memory" },
            { name: "cpu", type: "Float", label: "CPU" },
            { name: "maxcpu", type: "Integer", label: "Maximum CPU" },
            { name: "uptime", type: "Integer", label: "Uptime" },
          ];

        default:
          return []
      }
    },
    get_table: (cfgTable) => {
      return {
        getRows: async (where, opts) => {
          const qres = await runQuery({ ...modcfg, ...cfgTable }, where, opts);
          return qres;
        },
      };
    },
  },
});

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
  const nodes = await proxmox.nodes.$get();
  console.log(nodes);

  return [];
};

module.exports = (modcfg) => ({
  Proxmox: {
    configuration_workflow: configuration_workflow(modcfg),
    fields: (cfgTable) => [
      { name: "url", type: "String", label: "URL", primary_key: true },
    ],
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

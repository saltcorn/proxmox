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
                attributes: { options: ["Node", "QEMU"] },
              },
            ],
          });
        },
      },
    ],
  });

let cache = {};
let cacheTime = null;

const cacheIsFresh = () => {
  if (!cacheTime) return false;
  const now = new Date();

  // 1 s TTL
  return now.getTime() - cacheTime < 1000;
};
const fillCache = async (cfg) => {
  if (cacheIsFresh()) return;
  const proxmox = proxmoxApi({
    host: cfg.host,
    password: cfg.password,
    username: cfg.username,
  });
  cache.nodes = await proxmox.nodes.$get();

  const all_qemus = [];

  for (const node of cache.nodes) {
    const theNode = proxmox.nodes.$(node.node);
    // list Qemu VMS
    const qemus = await theNode.qemu.$get({ full: true });
    all_qemus.push(...qemus.map((q) => ({ node: node.id, ...q })));
  }
  cache.qemus = all_qemus;
};
const getNodes = async (cfg) => {
  await fillCache(cfg);
  return cache.nodes;
};

const getQEMUs = async (cfg) => {
  await fillCache(cfg);
  return cache.qemus;
};

const runQuery = async (cfg, where, opts) => {
  // list nodes
  switch (cfg.entity_type) {
    case "Node": {
      return await getNodes();
    }
    case "QEMU": {
      return await getQEMUs();
    }
    default:
      return [];
  }
};

module.exports = (modcfg) => ({
  Proxmox: {
    configuration_workflow: configuration_workflow(modcfg),
    fields: (cfgTable) => {
      switch (cfgTable?.entity_type) {
        case "Node":
          return [
            { name: "id", type: "String", label: "ID", primary_key: true },
            { name: "status", type: "String", label: "Status" },
            { name: "node", type: "String", label: "Node" },
            { name: "level", type: "String", label: "Level" },
            {
              name: "ssl_fingerprint",
              type: "String",
              label: "SSL fingerprint",
            },
            { name: "disk", type: "Integer", label: "Disk" },
            { name: "maxdisk", type: "Integer", label: "Maximum Disk" },
            { name: "mem", type: "Integer", label: "Memory" },
            { name: "maxmem", type: "Integer", label: "Maximum Memory" },
            { name: "cpu", type: "Float", label: "CPU" },
            { name: "maxcpu", type: "Integer", label: "Maximum CPU" },
            { name: "uptime", type: "Integer", label: "Uptime" },
          ];
        case "QEMU":
          return [
            { name: "vmid", type: "Integer", label: "VMID", primary_key: true },
            { name: "node", type: "String", label: "Node" },
            { name: "name", type: "String", label: "Name" },
            { name: "tags", type: "String", label: "Tags" },
            { name: "mem", type: "Integer", label: "Memory" },
            { name: "maxmem", type: "Integer", label: "Maximum Memory" },
            { name: "freemem", type: "Integer", label: "Free Memory" },
            { name: "cpu", type: "Float", label: "CPU" },
            { name: "cpus", type: "Integer", label: "CPUs" },
            { name: "uptime", type: "Integer", label: "Uptime" },
            { name: "status", type: "String", label: "Status" },
            { name: "qmpstatus", type: "String", label: "QMP Status" },
            { name: "netin", type: "Integer", label: "Net In" },
            { name: "netout", type: "Integer", label: "Net Out" },
            { name: "diskread", type: "Integer", label: "Disk read" },
          ];
        default:
          return [
            { name: "id", type: "String", label: "ID", primary_key: true },
          ];
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

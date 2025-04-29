const db = require("@saltcorn/data/db");
const Form = require("@saltcorn/data/models/form");
const Field = require("@saltcorn/data/models/field");
const Table = require("@saltcorn/data/models/table");
const FieldRepeat = require("@saltcorn/data/models/fieldrepeat");
const Workflow = require("@saltcorn/data/models/workflow");
const { eval_expression } = require("@saltcorn/data/models/expression");
const {
  text,
  div,
  h5,
  style,
  a,
  script,
  pre,
  domReady,
  i,
  text_attr,
} = require("@saltcorn/markup/tags");
const { mkTable } = require("@saltcorn/markup");
const { readState } = require("@saltcorn/data/plugin-helper");

const configuration_workflow = () =>
  new Workflow({
    steps: [
      {
        name: "Authentication",
        form: async (context) => {
          return new Form({
            fields: [
              {
                name: "url",
                label: "Cluster URL",
                type: "String",
              },
              {
                name: "username",
                label: "User name",
                type: "String",
              },
              {
                name: "password",
                label: "Password",
                input_type: "password",
              },
            ],
          });
        },
      },
    ],
  });

module.exports = {
  sc_plugin_api_version: 1,
  plugin_name: "proxmox",
  configuration_workflow,
  table_providers: require("./table-provider.js"),
  actions: (cfg) => ({
    caldav_sync: require("./sync-action")(cfg),
    caldav_edit: require("./add-action")(cfg),
  }),
};

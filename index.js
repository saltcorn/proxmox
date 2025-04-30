const Form = require("@saltcorn/data/models/form");
const Workflow = require("@saltcorn/data/models/workflow");

const configuration_workflow = () =>
  new Workflow({
    steps: [
      {
        name: "Authentication",
        form: async (context) => {
          return new Form({
            fields: [
              {
                name: "host",
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
    proxmox_modify: require("./action")(cfg),
  }),
};

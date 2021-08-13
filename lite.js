
const { TimeoutError }			= require('@whi/promise-timeout');

const { log,
	set_tostringtag }		= require('./src/utils.js');
const { ...ErrorTypes }			= require('./src/errors.js');
const { AppSchema, DnaSchema }		= require('./src/schemas.js');
const { ZomeApi }			= require('./src/zome_api.js');
const { Connection }			= require('./src/connection.js');
const { AgentClient }			= require('./src/agent_client.js');


module.exports = {
    Connection,

    AppSchema,
    DnaSchema,

    AgentClient,

    ZomeApi,

    ...ErrorTypes,
    TimeoutError,

    logging () {
	log.debug			= true;
    },
};

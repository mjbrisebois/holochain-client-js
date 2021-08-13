
const { TimeoutError }			= require('@whi/promise-timeout');
const { HoloHash }			= require('@whi/holo-hash');

const { log,
	set_tostringtag }		= require('./utils.js');
const { ...ErrorTypes }			= require('./errors.js');
const { AppSchema, DnaSchema }		= require('./schemas.js');
const { ZomeApi }			= require('./zome_api.js');
const { Connection }			= require('./connection.js');
const { AdminClient }			= require('./admin_client.js');
const { AgentClient }			= require('./agent_client.js');


module.exports = {
    Connection,

    AppSchema,
    DnaSchema,

    AdminClient,
    AgentClient,

    ZomeApi,

    ...ErrorTypes,
    TimeoutError,

    HoloHash,

    logging () {
	log.debug			= true;
    },
};

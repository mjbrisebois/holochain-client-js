
import {
    AgentClient,
    AppSchema,
    DnaSchema,
    ZomeApi,

    sha512,
    hash_secret,
    reformat_app_info,
    reformat_cell_id,
    logging as agent_logging,

    // Forwarded from @whi/holochain-serialization
    hashZomeCall,

    // Forwarded from @whi/holo-hash
    HoloHashes,

    // Forwarded from @whi/holochain-websocket
    HolochainWebsocket,
}					from '@whi/holochain-agent-client';
import {
    AdminClient,
    DeprecationNotice,
    logging as admin_logging,
}					from '@whi/holochain-admin-client';

import HolochainAgentClient		from '@whi/holochain-agent-client';
import HolochainAdminClient		from '@whi/holochain-admin-client';

export function logging () {
    agent_logging();
    admin_logging();
}

export {
    HolochainAgentClient,
    HolochainAdminClient,

    // Forwarded from @whi/holochain-admin-client
    AdminClient,
    DeprecationNotice,

    // Forwarded from @whi/holochain-agent-client
    AgentClient,
    AppSchema,
    DnaSchema,
    ZomeApi,

    sha512,
    hash_secret,
    reformat_app_info,
    reformat_cell_id,

    // Forwarded from @whi/holochain-serialization
    hashZomeCall,

    // Forwarded from @whi/holo-hash
    HoloHashes,

    // Forwarded from @whi/holochain-websocket
    HolochainWebsocket,
};

export default {
    HolochainAgentClient,
    HolochainAdminClient,
    logging,

    // Forwarded from @whi/holochain-admin-client
    AdminClient,
    DeprecationNotice,

    // Forwarded from @whi/holochain-agent-client
    AgentClient,
    AppSchema,
    DnaSchema,
    ZomeApi,

    sha512,
    hash_secret,
    reformat_app_info,
    reformat_cell_id,

    // Forwarded from @whi/holochain-serialization
    hashZomeCall,

    // Forwarded from @whi/holo-hash
    HoloHashes,

    // Forwarded from @whi/holochain-websocket
    HolochainWebsocket,
};

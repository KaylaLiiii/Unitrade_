import { createAuthCompatModule } from '@/api/client/modules/auth';
import { createListingCompatModule } from '@/api/client/modules/listings';
import { createSavedListingCompatModule } from '@/api/client/modules/savedListings';
import { createConversationCompatModule } from '@/api/client/modules/conversations';
import { createMessageCompatModule } from '@/api/client/modules/messages';
import { createFunctionsCompatModule } from '@/api/client/modules/functions';
import { createUploadsCompatModule } from '@/api/client/modules/uploads';
import { createAppLogsCompatModule } from '@/api/client/modules/appLogs';

const entities = {};
entities.Listing = createListingCompatModule({
  fallbackListingModule: {},
});
entities.SavedListing = createSavedListingCompatModule({
  fallbackSavedListingModule: {},
});
entities.Conversation = createConversationCompatModule({
  fallbackConversationModule: {},
});
entities.Message = createMessageCompatModule({
  fallbackMessageModule: {},
});

export const base44 = {
  auth: createAuthCompatModule({
    fallbackAuthModule: {},
  }),
  entities,
  functions: createFunctionsCompatModule({
    fallbackFunctionsModule: {},
  }),
  integrations: createUploadsCompatModule({
    fallbackIntegrationsModule: {},
  }),
  appLogs: createAppLogsCompatModule(),
};

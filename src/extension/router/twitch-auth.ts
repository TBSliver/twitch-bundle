import URI from "urijs";
import {BundleAPI} from "../types-server";
import NodeCG from "nodecg/types";
import {randomBytes} from "crypto";
import {Request, Response} from "express";
import {RefreshingAuthProvider} from "@twurple/auth";

let auth_state: { [state: string]: number } = {};

// Loop through and expire any state tokens
function expireStates(): void {
    for (let state in auth_state)
        if (auth_state[state] > Date.now())
            delete auth_state[state];
}

// Adds and returns a new state token with expiry time
function addState(): string {
    const new_state = randomBytes(64).toString('hex');

    // 15 minutes should be enough time to authenticate
    auth_state[new_state] = Date.now() + (15 * 60 * 1000);

    // Also expire any states which are too old
    expireStates();

    return new_state;
}

// Check a particular state token. Will expire as part of the call
function checkState(state: string): boolean {
    let check = false;

    // Check if actually a valid state
    if (auth_state[state] < Date.now())
        check = true;

    // Delete it because it's been used
    delete auth_state[state];

    // Also expire any old states
    expireStates();

    return check;
}

interface CallbackQueryParams {
    state: string;
    code: string;
}

export function getTwitchAuthRouter(nodecg: BundleAPI, authProvider: RefreshingAuthProvider) {
    // @ts-ignore
    const router = nodecg.Router();

    // Redirect to Twitch's actual authorization endpoint
    // This has auth check so you must already be authenticated to NodeCG
    router.get('/authorize', nodecg.util.authCheck, (_req: Request, res: Response) => {

        const uri = new URI('https://id.twitch.tv/oauth2/authorize')
            .addSearch("client_id", nodecg.bundleConfig.twitchClientId)
            .addSearch("redirect_uri", getCallbackUrl(nodecg))
            .addSearch("response_type", "code")
            .addSearch("force_verify", "true")
            .addSearch("scope", "channel:read:subscriptions bits:read channel:read:redemptions channel_subscriptions chat:read chat:edit")
            .addSearch("state", addState());

        res.redirect(uri.toString());
    });

    // Receive redirect from twitch with code to swap out
    router.get('/callback', async (req: Request<{}, {}, {}, CallbackQueryParams>, res: Response) => {
        // Fail out early when not a known state
        nodecg.log.info(auth_state)
        const check = checkState(req.query.state)
        nodecg.log.info(`received callback state [${req.query.state}] ${check}`)
        if (!check) {
            res.status(401).send('Unauthorised');
        } else {
            await authProvider.addUserForCode(req.query.code);
            res.send('Success, you can now close this window!');
        }
    });

    // TODO can we get rid of these?
    // Probably, but need to output them somewhere sensible - maybe bundle logs during init?
    nodecg.listenFor('getAuthorizeUrl', (_v, ack) => ack.handled || (<NodeCG.UnhandledAcknowledgement>ack)(null, getAuthorizeUrl(nodecg)));
    nodecg.listenFor('getCallbackUrl', (_v, ack) => ack.handled || (<NodeCG.UnhandledAcknowledgement>ack)(null, getCallbackUrl(nodecg)));

    nodecg.mount(`/${nodecg.bundleName}`, router);

    return router;
}

export function getCallbackUrl(nodecg: BundleAPI) {
    return new URI()
        .protocol((nodecg.config.ssl?.enabled || nodecg.config.login.forceHttpsReturn) ? 'https' : 'http')
        .host(nodecg.config.baseURL)
        .path(`${nodecg.bundleName}/callback`)
        .toString();
}

export function getAuthorizeUrl(nodecg: BundleAPI) {
    return new URI()
        .protocol((nodecg.config.ssl?.enabled || nodecg.config.login.forceHttpsReturn) ? 'https' : 'http')
        .host(nodecg.config.baseURL)
        .path(`${nodecg.bundleName}/authorize`)
        .toString();
}

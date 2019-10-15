import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import algoliasearch from "algoliasearch";

// Cache for 24 hours on the client and 12 hours on the server
const CACHE_CONTROL = `public, max-age=${24 * 3600}, s-maxage=${12 * 3600}`;

// Init algolia
const algolia = algoliasearch(
  functions.config().algolia.app_id,
  functions.config().algolia.api_key
);
const algoliaIndex = algolia.initIndex("talks");

// Init Firebase
admin.initializeApp();
const db = admin.firestore();

// Middleware
const middleware = (
  req: functions.https.Request,
  res: functions.Response
): [functions.https.Request, functions.Response, boolean] => {
  // Disallow requests from foreign origins
  let approved = false;
  if (
    !["hero35.com", "heroes-9c313.web.app", "localhost"].includes(req.headers[
      "x-forwarded-host"
    ] as string)
  ) {
    res.set("Access-Control-Allow-Origin", "https://hero35.com");
  } else {
    approved = true;
    res.set({
      "Access-Control-Allow-Origin": "*",
      "Cache-control": CACHE_CONTROL
    });
  }
  return [req, res, approved];
};

/**
 * SSR /index
 */
const ssrIndex = functions.https.onRequest(async (req, res) => {
  const [request, response, approved] = middleware(req, res);
  if (!approved) return response.send();
  const page = require("./next/serverless/pages/index");
  return page.render(request, response);
});

/**
 * SSR /account
 */
const ssrAccount = functions.https.onRequest(async (req, res) => {
  const [request, response, approved] = middleware(req, res);
  if (!approved) return response.send();
  response.sendFile(`${__dirname}/next/serverless/pages/account.html`);
});

/**
 * SSR /curated
 */
const ssrCurated = functions.https.onRequest(async (req, res) => {
  const [request, response, approved] = middleware(req, res);
  if (!approved) return response.send();
  const page = require("./next/serverless/pages/curated-conference-talks");
  return page.render(request, response);
});

/**
 * SSR /country
 */
const ssrCountry = functions.https.onRequest(async (req, res) => {
  const [request, response, approved] = middleware(req, res);
  if (!approved) return response.send();
  const page = require("./next/serverless/pages/country/[countryid]");
  return page.render(request, response);
});

/**
 * SSR /event
 */
const ssrEvent = functions.https.onRequest(async (req, res) => {
  const [request, response, approved] = middleware(req, res);
  if (!approved) return response.send();
  const page = require("./next/serverless/pages/[eventid]");
  return page.render(request, response);
});

/**
 * SSR /edition
 */
const ssrEdition = functions.https.onRequest(async (req, res) => {
  const [request, response, approved] = middleware(req, res);
  if (!approved) return response.send();
  const page = require("./next/serverless/pages/[eventid]/[editionid]");
  return page.render(request, response);
});

/**
 * SSR /hero
 */
const ssrHero = functions.https.onRequest(async (req, res) => {
  const [request, response, approved] = middleware(req, res);
  if (!approved) return response.send();
  const page = require("./next/serverless/pages/hero/[heroid]");
  return page.render(request, response);
});

/**
 * SSR /privacy-policy
 */
const ssrPrivacyPolicy = functions.https.onRequest(async (req, res) => {
  const [request, response, approved] = middleware(req, res);
  if (!approved) return response.send();
  response.sendFile(`${__dirname}/next/serverless/pages/privacy-policy.html`);
});

/**
 * SSR /terms-of-service
 */
const ssrTermsOfService = functions.https.onRequest(async (req, res) => {
  const [request, response, approved] = middleware(req, res);
  if (!approved) return response.send();
  response.sendFile(`${__dirname}/next/serverless/pages/terms-of-service.html`);
});

/**
 * SSR /talk
 */
const ssrTalk = functions.https.onRequest(async (req, res) => {
  const [request, response, approved] = middleware(req, res);
  if (!approved) return response.send();
  const page = require("./next/serverless/pages/[eventid]/[editionid]/[talkslug]");
  return page.render(request, response);
});

/**
 * SSR /topic
 */
const ssrTopic = functions.https.onRequest(async (req, res) => {
  const [request, response, approved] = middleware(req, res);
  if (!approved) return response.send();
  const page = require("./next/serverless/pages/topic/[topicid]");
  return page.render(request, response);
});

/**
 * SSR /year
 */
const ssrYear = functions.https.onRequest(async (req, res) => {
  const [request, response, approved] = middleware(req, res);
  if (!approved) return response.send();
  const page = require("./next/serverless/pages/year/[yearid]");
  return page.render(request, response);
});

/**
 * Update Algolia search index, on talk create/update/delete
 */
const indexTalk = functions.firestore
  .document("events/{eventid}/editions/{editionid}/talks/{talkid}")
  .onWrite((snap, context) => {
    let talk: any;
    if (snap.after.exists) {
      talk = snap.after.data();
      // Add an 'objectID' field which Algolia requires
      talk.objectID = talk.id;
    } else {
      talk = { objectID: snap.before.data().id };
    }
    // Only index: Talk, Lightning talk, Panels, Q&A, Workshops, and Interviews
    if (["2", "3", "4", "5", "7", "8"].includes(talk.type)) {
      return algoliaIndex.saveObject(talk);
    } else {
      return true;
    }
  });

/**
 * Get Event
 */
const event = functions.https.onRequest(async (req, res) => {
  const [request, response, approved] = middleware(req, res);
  if (!approved) return response.send();
  const eventId = request.query.id;
  if (!eventId) response.send("event id is required");
  const docRef = await db.collection("events").doc(eventId);
  const docSnap = await docRef.get();
  let event = docSnap.data();
  if (event) {
    const querySnapshot = await docRef.collection("editions").get();
    let editions = [];
    querySnapshot.forEach(doc => {
      editions.push(doc.data());
    });
    event.editions = editions;
  }
  response.json(event);
});

/**
 * Get Edition
 */
const edition = functions.https.onRequest(async (req, res) => {
  const [request, response, approved] = middleware(req, res);
  if (!approved) return response.send();
  const eventId = request.query.eventId;
  const editionId = request.query.editionId;
  if (!eventId) response.send("eventId is required");
  if (!editionId) response.send("editionId is required");
  const docSnap = await db
    .collection("events")
    .doc(eventId)
    .collection("editions")
    .doc(editionId)
    .get();
  const edition = docSnap.data();
  response.json(edition);
});

/**
 * Get editions by country
 */
const editionsByCountry = functions.https.onRequest(async (req, res) => {
  const [request, response, approved] = middleware(req, res);
  if (!approved) return response.send();
  const docSnap = await db
    .collectionGroup("editions")
    .where("country", "==", request.query.id)
    .orderBy("dateTimestamp", "desc")
    .limit(1000)
    .get();
  let editions = [];
  docSnap.forEach(doc => {
    editions.push(doc.data());
  });
  response.json(editions);
});

/**
 * Get editions by year
 */
const editionsByYear = functions.https.onRequest(async (req, res) => {
  const [request, response, approved] = middleware(req, res);
  if (!approved) return response.send();
  const docSnap = await db
    .collectionGroup("editions")
    // TODO use timestamp
    .where("id", "==", request.query.id)
    .orderBy("dateTimestamp", "desc")
    .limit(1000)
    .get();
  let editions = [];
  docSnap.forEach(doc => {
    editions.push(doc.data());
  });
  response.json(editions);
});

/**
 * Get recent Editions
 */
const recentEditions = functions.https.onRequest(async (req, res) => {
  const [request, response, approved] = middleware(req, res);
  if (!approved) return response.send();
  const docSnap = await db
    .collectionGroup("editions")
    .where("status", "==", "published")
    .orderBy("dateTimestamp", "desc")
    .limit(6)
    .get();
  let editions = [];
  docSnap.forEach(doc => {
    editions.push(doc.data());
  });
  response.json(editions);
});

/**
 * Get upcoming Editions
 */
const upcomingEditions = functions.https.onRequest(async (req, res) => {
  const [request, response, approved] = middleware(req, res);
  if (!approved) return response.send();
  const docSnap = await db
    .collectionGroup("editions")
    .where("status", "==", "published-notalks")
    .where("dateTimestamp", ">", admin.firestore.Timestamp.now())
    .orderBy("dateTimestamp", "asc")
    .limit(4)
    .get();
  let editions = [];
  docSnap.forEach(doc => {
    editions.push(doc.data());
  });
  response.json(editions);
});

/**
 * Get Talk
 */
const talk = functions.https.onRequest(async (req, res) => {
  const [request, response, approved] = middleware(req, res);
  if (!approved) return response.send();
  const eventId = request.query.eventId;
  const editionId = request.query.editionId;
  const talkSlug = request.query.talkSlug;
  if (!eventId) response.send("eventId is required");
  if (!editionId) response.send("editionId is required");
  if (!talkSlug) response.send("talkSlug is required");
  const docSnap = await db
    .collectionGroup("talks")
    .where("eventId", "==", eventId)
    .where("editionId", "==", editionId)
    .where("slug", "==", talkSlug)
    .limit(1)
    .get();
  const talk = docSnap.docs[0] ? docSnap.docs[0].data() : null;
  response.json(talk);
});

/**
 * Get filtered Talks
 */
const filterTalks = functions.https.onRequest(async (req, res) => {
  const [request, response, approved] = middleware(req, res);
  if (!approved) return response.send();
  const docSnap = await db
    .collectionGroup("talks")
    .where("type", "==", request.query.type)
    .where("tags", "array-contains", request.query.topic)
    .where("isCurated", "==", request.query.curated)
    .orderBy(request.query.orderBy, request.query.sortOrder)
    .limit(100)
    .get();
  let talks = [];
  docSnap.forEach(doc => {
    talks.push(doc.data());
  });
  response.json(talks);
});

/**
 * Get recent Talks
 */
const recentTalks = functions.https.onRequest(async (req, res) => {
  const [request, response, approved] = middleware(req, res);
  if (!approved) return response.send();
  const docSnap = await db
    .collectionGroup("talks")
    .where("type", "==", "2")
    .orderBy("dateTimestamp", "desc")
    .orderBy("order", "desc")
    .limit(6)
    .get();
  let talks = [];
  docSnap.forEach(doc => {
    talks.push(doc.data());
  });
  response.json(talks);
});

/**
 * Get hero Talks
 */
const heroTalks = functions.https.onRequest(async (req, res) => {
  const [request, response, approved] = middleware(req, res);
  if (!approved) return response.send();
  const docSnap = await db
    .collectionGroup("talks")
    .where("speaker", "==", decodeURI(request.query.name))
    .orderBy("dateTimestamp", "desc")
    .get();
  let talks = [];
  docSnap.forEach(doc => {
    talks.push(doc.data());
  });
  response.json(talks);
});

/**
 * Get curated Talks
 */
const curatedTalks = functions.https.onRequest(async (req, res) => {
  const [request, response, approved] = middleware(req, res);
  if (!approved) return response.send();
  let recordCount = parseInt(request.query.records);
  if (recordCount < 1) {
    recordCount = 4;
  } else if (recordCount > 20) {
    recordCount = 20;
  }
  const docSnap = await db
    .collectionGroup("talks")
    .where("isCurated", "==", true)
    .orderBy("dateTimestamp", "desc")
    .orderBy("order", "desc")
    .limit(recordCount)
    .get();
  let talks = [];
  docSnap.forEach(doc => {
    talks.push(doc.data());
  });
  response.json(talks);
});

/**
 * Get talks by topic
 */
const talksByTopic = functions.https.onRequest(async (req, res) => {
  const [request, response, approved] = middleware(req, res);
  if (!approved) return response.send();
  const docSnap = await db
    .collectionGroup("talks")
    .where("tags", "array-contains", request.query.id)
    .orderBy("dateTimestamp", "desc")
    .limit(1000)
    .get();
  let talks = [];
  docSnap.forEach(doc => {
    talks.push(doc.data());
  });
  response.json(talks);
});

const heroes = {
  curatedTalks,
  heroTalks,
  edition,
  editionsByCountry,
  editionsByYear,
  event,
  filterTalks,
  indexTalk,
  recentEditions,
  ssrIndex,
  ssrAccount,
  ssrCountry,
  ssrCurated,
  ssrEdition,
  ssrEvent,
  ssrHero,
  ssrPrivacyPolicy,
  ssrTalk,
  ssrTermsOfService,
  ssrTopic,
  ssrYear,
  talk,
  recentTalks,
  talksByTopic,
  upcomingEditions
};

export { heroes };

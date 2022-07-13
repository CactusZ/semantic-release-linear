"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveCards = exports.getLinearCards = exports.getCardAuthorsMap = exports.checkTeamsInLinear = void 0;
var lodash_1 = __importDefault(require("lodash"));
function checkTeamsInLinear(_a) {
    var linearClient = _a.linearClient, context = _a.context, teamKeys = _a.teamKeys;
    return __awaiter(this, void 0, void 0, function () {
        var fetchedTeams, teams;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    context.logger.log("Checking if you have access to all teams in Linear...");
                    return [4 /*yield*/, linearClient.teams({
                            filter: {
                                key: {
                                    in: teamKeys,
                                },
                            },
                        })];
                case 1:
                    fetchedTeams = _b.sent();
                    teams = fetchedTeams.nodes;
                    if (teamKeys.length !== teams.length) {
                        context.logger.error("You don't have access to all teams in Linear");
                        context.logger.error("You have access to ".concat(teams.length, " teams in Linear: ").concat(teams
                            .map(function (t) { return t.key; })
                            .join(", ")));
                        context.logger.error("You need to have access to these teams: ".concat(teamKeys.join(", ")));
                        throw new Error("You don't have access to all teams in Linear");
                    }
                    context.logger.log("All teams found in Linear");
                    return [2 /*return*/];
            }
        });
    });
}
exports.checkTeamsInLinear = checkTeamsInLinear;
function getCardAuthorsMap(cards) {
    return __awaiter(this, void 0, void 0, function () {
        var cardAuthors, cardAuthorsMap;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Promise.all(cards.map(function (card) { return card.assignee; }))];
                case 1:
                    cardAuthors = _a.sent();
                    cardAuthorsMap = cardAuthors.reduce(function (acc, author) {
                        if (author) {
                            acc[author.email] = author;
                        }
                        return acc;
                    }, {});
                    return [2 /*return*/, cardAuthorsMap];
            }
        });
    });
}
exports.getCardAuthorsMap = getCardAuthorsMap;
function getLinearCards(_a) {
    var stateName = _a.stateName, linearClient = _a.linearClient, context = _a.context, teamKeys = _a.teamKeys;
    return __awaiter(this, void 0, void 0, function () {
        var cards;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    context.logger.log("Getting all ".concat(stateName, " cards..."));
                    return [4 /*yield*/, linearClient.issues({
                            filter: {
                                state: {
                                    name: {
                                        eq: stateName,
                                    },
                                },
                                team: {
                                    key: {
                                        in: teamKeys,
                                    },
                                },
                            },
                        })];
                case 1:
                    cards = _b.sent();
                    context.logger.log("".concat(cards.nodes.length, " cards are ").concat(stateName));
                    return [2 /*return*/, cards.nodes];
            }
        });
    });
}
exports.getLinearCards = getLinearCards;
function moveCards(_a) {
    var cards = _a.cards, toState = _a.toState, context = _a.context, includeChildren = _a.includeChildren, relatedIssueMutation = _a.relatedIssueMutation;
    return __awaiter(this, void 0, void 0, function () {
        var statesPerTeam, _i, cards_1, card;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    context.logger.log("Moving ".concat(cards.length, " cards to state ").concat(toState, "..."));
                    return [4 /*yield*/, getTeamStatesFromCards({
                            cards: cards,
                            toState: toState,
                            context: context,
                        })];
                case 1:
                    statesPerTeam = _b.sent();
                    _i = 0, cards_1 = cards;
                    _b.label = 2;
                case 2:
                    if (!(_i < cards_1.length)) return [3 /*break*/, 5];
                    card = cards_1[_i];
                    return [4 /*yield*/, moveCard({
                            card: card,
                            statesPerTeam: statesPerTeam,
                            toState: toState,
                            context: context,
                            includeChildren: includeChildren,
                        })];
                case 3:
                    _b.sent();
                    _b.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/];
            }
        });
    });
}
exports.moveCards = moveCards;
function moveCard(_a) {
    var _b, _c, _d, _e;
    var card = _a.card, statesPerTeam = _a.statesPerTeam, toState = _a.toState, context = _a.context, includeChildren = _a.includeChildren, relatedIssueMutation = _a.relatedIssueMutation;
    return __awaiter(this, void 0, void 0, function () {
        var team, teamId, teamKey, stateId, subIssues, _i, subIssues_1, subIssue, relatedIssues, relatedCards, team_1, newStateId_1;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0: return [4 /*yield*/, card.team];
                case 1:
                    team = _f.sent();
                    if (!team) {
                        context.logger.error("Card ".concat(card.id, " has no team"));
                        throw new Error("Card ".concat(card.id, " has no team"));
                    }
                    teamId = team === null || team === void 0 ? void 0 : team.id;
                    teamKey = team === null || team === void 0 ? void 0 : team.key;
                    if (!teamId || !teamKey) {
                        context.logger.error("Card ".concat(card.id, " has no team id or key"));
                        throw new Error("Card ".concat(card.id, " has no team id or key"));
                    }
                    context.logger.log("Moving card ".concat(card.identifier, " to state ").concat(toState));
                    stateId = (_b = statesPerTeam[teamKey].find(function (s) { return s.name === toState; })) === null || _b === void 0 ? void 0 : _b.id;
                    if (!stateId) {
                        context.logger.error("Team ".concat(teamKey, " has no state ").concat(toState));
                        throw new Error("Team ".concat(teamKey, " has no state ").concat(toState));
                    }
                    if (!includeChildren) return [3 /*break*/, 6];
                    return [4 /*yield*/, card.children()];
                case 2:
                    subIssues = (_f.sent()).nodes || [];
                    _i = 0, subIssues_1 = subIssues;
                    _f.label = 3;
                case 3:
                    if (!(_i < subIssues_1.length)) return [3 /*break*/, 6];
                    subIssue = subIssues_1[_i];
                    context.logger.log("Moving sub-issue ".concat(subIssue.identifier, " of issue ").concat(card.identifier));
                    return [4 /*yield*/, moveCard({
                            card: subIssue,
                            statesPerTeam: statesPerTeam,
                            toState: toState,
                            context: context,
                            includeChildren: includeChildren,
                        })];
                case 4:
                    _f.sent();
                    _f.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: return [4 /*yield*/, card.update({
                        stateId: stateId,
                    })];
                case 7:
                    _f.sent();
                    if (!relatedIssueMutation) return [3 /*break*/, 13];
                    return [4 /*yield*/, card.relations()];
                case 8:
                    relatedIssues = (_f.sent()).nodes;
                    return [4 /*yield*/, Promise.all(relatedIssues.map(function (issue) { return issue.relatedIssue; }))];
                case 9:
                    relatedCards = (_f.sent()).filter(function (issue) { return (issue === null || issue === void 0 ? void 0 : issue.team) === relatedIssueMutation.teamKey; });
                    if (!relatedCards.length) return [3 /*break*/, 13];
                    return [4 /*yield*/, ((_c = relatedCards[0]) === null || _c === void 0 ? void 0 : _c.team)];
                case 10:
                    team_1 = _f.sent();
                    return [4 /*yield*/, (team_1 === null || team_1 === void 0 ? void 0 : team_1.states())];
                case 11:
                    newStateId_1 = (_e = (_d = (_f.sent())) === null || _d === void 0 ? void 0 : _d.nodes.find(function (state) { return state.name === relatedIssueMutation.stateName; })) === null || _e === void 0 ? void 0 : _e.id;
                    if (!newStateId_1) {
                        throw new Error("State not found ".concat(relatedIssueMutation.stateName));
                    }
                    return [4 /*yield*/, Promise.all(relatedCards.map(function (card) { return card === null || card === void 0 ? void 0 : card.update({ stateId: newStateId_1 }); }))];
                case 12:
                    _f.sent();
                    _f.label = 13;
                case 13:
                    context.logger.log("Moved card ".concat(card.identifier, " to state ").concat(toState));
                    return [2 /*return*/];
            }
        });
    });
}
function getTeamStatesFromCards(_a) {
    var cards = _a.cards, toState = _a.toState, context = _a.context;
    return __awaiter(this, void 0, void 0, function () {
        var teams, uniqueTeams, states, statesPerTeam;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    context.logger.log("Getting states for all teams");
                    return [4 /*yield*/, Promise.all(cards.map(function (card) { return card.team; }))];
                case 1:
                    teams = (_b.sent()).filter(isTeam);
                    context.logger.log("Found ".concat(teams.length, " teams"));
                    uniqueTeams = lodash_1.default.uniqBy(teams, function (t) { return t.key; });
                    context.logger.log("Found ".concat(uniqueTeams.length, " unique teams"));
                    return [4 /*yield*/, Promise.all(uniqueTeams.map(function (t) { return t.states(); }))];
                case 2:
                    states = (_b.sent()).map(function (s) { return s.nodes; });
                    context.logger.log("Found states");
                    statesPerTeam = states.reduce(function (acc, s, index) {
                        var team = uniqueTeams[index];
                        acc[team.key] = s.filter(function (s) { return s.name === toState; });
                        return acc;
                    }, {});
                    context.logger.log("Calculated states per team");
                    return [2 /*return*/, statesPerTeam];
            }
        });
    });
}
function isTeam(t) {
    return !!t;
}

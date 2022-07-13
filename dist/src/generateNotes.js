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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateNotes = void 0;
var sdk_1 = require("@linear/sdk");
var lodash_1 = __importDefault(require("lodash"));
var constants_1 = require("./constants");
var api_1 = require("./linear/api");
function generateNotes(pluginConfig, context) {
    return __awaiter(this, void 0, void 0, function () {
        var linearClient, branch, notesConfigForBranch, stateName, cards, releaseNotes;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!pluginConfig.generateNotes) {
                        return [2 /*return*/];
                    }
                    linearClient = new sdk_1.LinearClient({
                        apiKey: context.env[constants_1.ENV_LINEAR_API_KEY],
                    });
                    branch = context.envCi.branch;
                    notesConfigForBranch = pluginConfig.generateNotes.find(function (b) { return b.branchName === branch; });
                    stateName = notesConfigForBranch === null || notesConfigForBranch === void 0 ? void 0 : notesConfigForBranch.stateName;
                    if (!stateName) {
                        throw new Error("State not found for branch ".concat(branch));
                    }
                    return [4 /*yield*/, getEligibleCardsFromLinear({
                            stateName: stateName,
                            linearClient: linearClient,
                            context: context,
                            pluginConfig: pluginConfig,
                        })];
                case 1:
                    cards = _a.sent();
                    return [4 /*yield*/, generateReleaseNotesFromCards({
                            cards: cards,
                            notesConfigForBranch: notesConfigForBranch,
                        })];
                case 2:
                    releaseNotes = _a.sent();
                    return [2 /*return*/, releaseNotes.join("\n")];
            }
        });
    });
}
exports.generateNotes = generateNotes;
function getEligibleCardsFromLinear(_a) {
    var stateName = _a.stateName, linearClient = _a.linearClient, context = _a.context, pluginConfig = _a.pluginConfig;
    return __awaiter(this, void 0, void 0, function () {
        var unsortedCards, _b, cards;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _b = filterOutSubIssues;
                    return [4 /*yield*/, (0, api_1.getLinearCards)({
                            stateName: stateName,
                            linearClient: linearClient,
                            context: context,
                            teamKeys: pluginConfig.teamKeys,
                        })];
                case 1: return [4 /*yield*/, _b.apply(void 0, [_c.sent()])];
                case 2:
                    unsortedCards = _c.sent();
                    cards = lodash_1.default.sortBy(unsortedCards, "identifier");
                    return [2 /*return*/, cards];
            }
        });
    });
}
function generateReleaseNotesFromCards(_a) {
    var _b;
    var cards = _a.cards, notesConfigForBranch = _a.notesConfigForBranch;
    return __awaiter(this, void 0, void 0, function () {
        var releaseNotes, unmentionedCards, _loop_1, _i, _c, category, _d, unmentionedCards_1, card;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    releaseNotes = [];
                    releaseNotes.push("## Linear Cards released");
                    if (!cards.length) return [3 /*break*/, 5];
                    unmentionedCards = cards.slice();
                    _loop_1 = function (category) {
                        var filteredCards, relationCriteria, _f, filteredCards_1, card, relatedCard;
                        return __generator(this, function (_g) {
                            switch (_g.label) {
                                case 0: return [4 /*yield*/, filterCards({ category: category, cards: cards })];
                                case 1:
                                    filteredCards = _g.sent();
                                    relationCriteria = (_b = category.criteria.find(function (c) { return c.relatedToIssueInTeam; })) === null || _b === void 0 ? void 0 : _b.relatedToIssueInTeam;
                                    releaseNotes.push("### ".concat(category.title));
                                    releaseNotes.push(getCardTableHeader(relationCriteria));
                                    _f = 0, filteredCards_1 = filteredCards;
                                    _g.label = 2;
                                case 2:
                                    if (!(_f < filteredCards_1.length)) return [3 /*break*/, 5];
                                    card = filteredCards_1[_f];
                                    return [4 /*yield*/, getRelatedCard({
                                            teamKey: relationCriteria,
                                            card: card,
                                        })];
                                case 3:
                                    relatedCard = _g.sent();
                                    releaseNotes.push(getCardTableRow({ card: card, relatedCard: relatedCard }));
                                    _g.label = 4;
                                case 4:
                                    _f++;
                                    return [3 /*break*/, 2];
                                case 5:
                                    unmentionedCards = unmentionedCards.filter(function (c) {
                                        return filteredCards.every(function (f) { return f.id !== c.id; });
                                    });
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, _c = notesConfigForBranch.categories;
                    _e.label = 1;
                case 1:
                    if (!(_i < _c.length)) return [3 /*break*/, 4];
                    category = _c[_i];
                    return [5 /*yield**/, _loop_1(category)];
                case 2:
                    _e.sent();
                    _e.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    if (unmentionedCards.length) {
                        releaseNotes.push("### Other");
                        for (_d = 0, unmentionedCards_1 = unmentionedCards; _d < unmentionedCards_1.length; _d++) {
                            card = unmentionedCards_1[_d];
                            releaseNotes.push("|[".concat(card.identifier, "](").concat(card.url, ")|").concat(card.title));
                        }
                    }
                    return [3 /*break*/, 6];
                case 5:
                    releaseNotes.push("None linear cards are released in this release");
                    _e.label = 6;
                case 6: return [2 /*return*/, releaseNotes];
            }
        });
    });
}
function filterCards(_a) {
    var category = _a.category, cards = _a.cards;
    return __awaiter(this, void 0, void 0, function () {
        var filteredCards, _i, _b, criteria, cardsByCriteria, _c, _d, _e, _f, _g, _h;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0:
                    filteredCards = [];
                    _i = 0, _b = category.criteria;
                    _j.label = 1;
                case 1:
                    if (!(_i < _b.length)) return [3 /*break*/, 9];
                    criteria = _b[_i];
                    cardsByCriteria = [];
                    if (!criteria.isInProject) return [3 /*break*/, 3];
                    _d = (_c = cardsByCriteria).push;
                    return [4 /*yield*/, getCardsInProjects(cards)];
                case 2:
                    _d.apply(_c, [_j.sent()]);
                    _j.label = 3;
                case 3:
                    if (!criteria.label) return [3 /*break*/, 5];
                    _f = (_e = cardsByCriteria).push;
                    return [4 /*yield*/, getCardsWithLabel({ cards: cards, label: criteria.label })];
                case 4:
                    _f.apply(_e, [_j.sent()]);
                    _j.label = 5;
                case 5:
                    if (!criteria.relatedToIssueInTeam) return [3 /*break*/, 7];
                    _h = (_g = cardsByCriteria).push;
                    return [4 /*yield*/, getCardsWithIssueInTeam({
                            cards: cards,
                            relatedTeamKey: criteria.relatedToIssueInTeam,
                        })];
                case 6:
                    _h.apply(_g, [_j.sent()]);
                    _j.label = 7;
                case 7:
                    filteredCards.push.apply(filteredCards, lodash_1.default.intersectionBy.apply(lodash_1.default, __spreadArray(__spreadArray([], cardsByCriteria, false), ["id"], false)));
                    _j.label = 8;
                case 8:
                    _i++;
                    return [3 /*break*/, 1];
                case 9: return [2 /*return*/, filteredCards];
            }
        });
    });
}
function getCardTableHeader(relationCriteria) {
    return "| Card Id ".concat(relationCriteria ? "| Related Card " : "", "| Card Title |\", \"| --- | --- |");
}
function getCardTableRow(_a) {
    var card = _a.card, relatedCard = _a.relatedCard;
    return "|[".concat(card.identifier, "](").concat(card.url, ")").concat(relatedCard ? "|[".concat(relatedCard.identifier, "](").concat(relatedCard.url, ")") : "", "|").concat(card.title);
}
function getRelatedCard(_a) {
    var _b;
    var teamKey = _a.teamKey, card = _a.card;
    return __awaiter(this, void 0, void 0, function () {
        var relatedCard, relations, _i, relations_1, relation, relatedIssue, team;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!teamKey) return [3 /*break*/, 6];
                    return [4 /*yield*/, card.relations()];
                case 1:
                    relations = (_c.sent()).nodes;
                    _i = 0, relations_1 = relations;
                    _c.label = 2;
                case 2:
                    if (!(_i < relations_1.length)) return [3 /*break*/, 6];
                    relation = relations_1[_i];
                    return [4 /*yield*/, relation.relatedIssue];
                case 3:
                    relatedIssue = _c.sent();
                    if (!relatedIssue) return [3 /*break*/, 5];
                    return [4 /*yield*/, relatedIssue.team];
                case 4:
                    team = (_b = (_c.sent())) === null || _b === void 0 ? void 0 : _b.key;
                    if (team === teamKey) {
                        relatedCard = relatedIssue;
                    }
                    _c.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 2];
                case 6: return [2 /*return*/, relatedCard];
            }
        });
    });
}
function getCardsWithLabel(_a) {
    var cards = _a.cards, label = _a.label;
    return __awaiter(this, void 0, void 0, function () {
        var result, _i, cards_1, card;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    result = [];
                    _i = 0, cards_1 = cards;
                    _b.label = 1;
                case 1:
                    if (!(_i < cards_1.length)) return [3 /*break*/, 4];
                    card = cards_1[_i];
                    return [4 /*yield*/, card.labels()];
                case 2:
                    if ((_b.sent()).nodes.some(function (l) { return l.name === label; })) {
                        result.push(card);
                    }
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, result];
            }
        });
    });
}
function getCardsInProjects(cards) {
    return __awaiter(this, void 0, void 0, function () {
        var result, _i, cards_2, card;
        return __generator(this, function (_a) {
            result = [];
            for (_i = 0, cards_2 = cards; _i < cards_2.length; _i++) {
                card = cards_2[_i];
                if (card.project) {
                    result.push(card);
                }
            }
            return [2 /*return*/, result];
        });
    });
}
function getCardsWithIssueInTeam(_a) {
    var _b;
    var cards = _a.cards, relatedTeamKey = _a.relatedTeamKey;
    return __awaiter(this, void 0, void 0, function () {
        var result, _i, cards_3, card, relations, hasTeamRelation, _c, relations_2, relation, relatedIssue, team;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    result = [];
                    _i = 0, cards_3 = cards;
                    _d.label = 1;
                case 1:
                    if (!(_i < cards_3.length)) return [3 /*break*/, 9];
                    card = cards_3[_i];
                    return [4 /*yield*/, card.relations()];
                case 2:
                    relations = (_d.sent()).nodes;
                    hasTeamRelation = false;
                    _c = 0, relations_2 = relations;
                    _d.label = 3;
                case 3:
                    if (!(_c < relations_2.length)) return [3 /*break*/, 7];
                    relation = relations_2[_c];
                    return [4 /*yield*/, relation.relatedIssue];
                case 4:
                    relatedIssue = _d.sent();
                    if (!relatedIssue) {
                        return [3 /*break*/, 6];
                    }
                    return [4 /*yield*/, relatedIssue.team];
                case 5:
                    team = (_b = (_d.sent())) === null || _b === void 0 ? void 0 : _b.key;
                    if (team === relatedTeamKey) {
                        hasTeamRelation = true;
                        return [3 /*break*/, 7];
                    }
                    _d.label = 6;
                case 6:
                    _c++;
                    return [3 /*break*/, 3];
                case 7:
                    if (hasTeamRelation) {
                        result.push(card);
                    }
                    _d.label = 8;
                case 8:
                    _i++;
                    return [3 /*break*/, 1];
                case 9: return [2 /*return*/, result];
            }
        });
    });
}
function filterOutSubIssues(cards) {
    return __awaiter(this, void 0, void 0, function () {
        var hasParentIssue, _loop_2, _i, cards_4, card;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    hasParentIssue = {};
                    _loop_2 = function (card) {
                        var parent_1;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, card.parent];
                                case 1:
                                    parent_1 = _b.sent();
                                    if (parent_1 && cards.some(function (c) { return c.id === parent_1.id; })) {
                                        hasParentIssue[card.id] = true;
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, cards_4 = cards;
                    _a.label = 1;
                case 1:
                    if (!(_i < cards_4.length)) return [3 /*break*/, 4];
                    card = cards_4[_i];
                    return [5 /*yield**/, _loop_2(card)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, cards.filter(function (c) { return !hasParentIssue[c.id]; })];
            }
        });
    });
}

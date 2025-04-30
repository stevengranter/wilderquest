"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
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
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
var promise_1 = require("mysql2/promise");
var faker_1 = require("@faker-js/faker");
var emoji = require("node-emoji");
var pluralize_1 = require("pluralize");
var cuid2_1 = require("@paralleldrive/cuid2");
var mnemonic_id_1 = require("mnemonic-id");
var weighted_1 = require("weighted");
var bcrypt_ts_1 = require("bcrypt-ts");
var fs_1 = require("fs");
var appConfig_js_1 = require("./config/appConfig.js");
var db = await promise_1.default.createConnection({
    host: appConfig_js_1.default.MYSQL_HOST,
    port: appConfig_js_1.default.MYSQL_PORT,
    database: appConfig_js_1.default.MYSQL_DATABASE,
    user: appConfig_js_1.default.MYSQL_USER,
    password: appConfig_js_1.default.MYSQL_PASSWORD,
});
var API_URL = 'https://api.inaturalist.org/v1/taxa/';
var generateFakeTaxa = function (quantity) {
    var taxa = [];
    for (var i = 0; i < quantity; i++) {
        taxa.push(getRandomInt(5000, 999999));
    }
    return taxa;
};
function getRandomInt(min, max) {
    if (min > max) {
        throw new Error('Min id must be less than or equal to max id.');
    }
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function capitalizeString(str) {
    if (!str) {
        return str; // Return the original string if it's empty or nullish
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
}
var adminUser = {
    username: 'admin',
    password: 'mypassword',
    email: 'adminUser555@example.com',
    user_cuid: (0, cuid2_1.createId)(),
    created_at: new Date(),
    updated_at: new Date(),
    role_id: 2,
};
// Function to log the raw user data to a file before password hashing
var logRawUserData = function (user) {
    var rawUserData = [
        user.username,
        user.email,
        user.password, // Log the password before hashing
        user.created_at,
        user.updated_at,
        user.user_cuid,
    ];
    // Append the data to a CSV file
    var csvRow = rawUserData.join(',') + '\n';
    fs_1.default.appendFile('raw_user_data.dev.csv', csvRow, function (err) {
        if (err) {
            console.error('Error logging user data:', err);
        }
        else {
            console.log('User data logged to file.');
        }
    });
};
// Function to ensure the CSV header is written to the file
var writeCsvHeader = function () {
    var header = 'username,email,password,created_at,updated_at,user_cuid\n';
    fs_1.default.writeFile('raw_user_data.dev.csv', header, function (err) {
        if (err) {
            console.error('Error writing CSV header:', err);
        }
    });
};
// Ensure the CSV header is written when the script starts
writeCsvHeader();
var createFakeUser = function () {
    var firstName = faker_1.faker.person.firstName();
    var lastName = faker_1.faker.person.lastName();
    var username = (0, mnemonic_id_1.createNameId)({ capitalize: true, delimiter: '' });
    var email = username.toLowerCase() + '@' + faker_1.faker.internet.domainName();
    var password = faker_1.faker.internet.password({ length: 8, memorable: true });
    var role_id = 1;
    var created_at = faker_1.faker.date.between({
        from: '2020-01-01',
        to: Date.now(),
    });
    var updated_at = faker_1.faker.date.between({
        from: '2020-01-01',
        to: Date.now(),
    });
    var user_cuid = (0, cuid2_1.createId)();
    return {
        username: username,
        email: email,
        password: password,
        role_id: role_id,
        created_at: created_at,
        updated_at: updated_at,
        user_cuid: user_cuid,
    };
};
var createFakeCollection = function (animal) {
    if (animal === void 0) { animal = faker_1.faker.animal.type(); }
    var user_id = getRandomInt(1, 12);
    // const animal = animal || faker.animal.type()
    var animalEmoji = emoji.find(animal);
    // let animalEmojiStr = ""
    // if (animalEmoji) {animalEmojiStr = animalEmoji.emoji.toString()}
    var prefixStr = ['', 'Awesome ', 'My favourite ', 'I love '];
    var suffixStr = ['', ' ❤️', (animalEmoji === null || animalEmoji === void 0 ? void 0 : animalEmoji.emoji) || '😍', '!'];
    var weights = [0.49, 0.17, 0.17, 0.17];
    var nameStr = weighted_1.default.select(prefixStr, weights) +
        (0, pluralize_1.default)(animal) +
        ' ' +
        weighted_1.default.select(suffixStr, weights);
    var name = capitalizeString(nameStr);
    var created_at = faker_1.faker.date.between({
        from: '2020-01-01',
        to: Date.now(),
    });
    var updated_at = faker_1.faker.date.between({
        from: '2020-01-01',
        to: Date.now(),
    });
    return {
        name: name,
        user_id: user_id,
        emoji: (animalEmoji === null || animalEmoji === void 0 ? void 0 : animalEmoji.emoji) || '🐾',
        created_at: created_at,
        updated_at: updated_at,
    };
};
var createUsers = function (quantity) { return __awaiter(void 0, void 0, void 0, function () {
    var userIds, i, user, user_id, numberOfCollections, j, animal, collection, collection_id, numberOfTaxa, taxaArray, _i, taxaArray_1, taxon_id;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userIds = [];
                i = 0;
                _a.label = 1;
            case 1:
                if (!(i < quantity)) return [3 /*break*/, 11];
                user = createFakeUser();
                logRawUserData(user);
                return [4 /*yield*/, addUserToDatabase(user)];
            case 2:
                user_id = _a.sent();
                if (!user_id) {
                    console.log('Error adding user to db');
                    return [2 /*return*/];
                }
                numberOfCollections = getRandomInt(0, 5);
                j = 0;
                _a.label = 3;
            case 3:
                if (!(j < numberOfCollections)) return [3 /*break*/, 10];
                animal = faker_1.faker.animal.type();
                collection = createFakeCollection(animal);
                collection.user_id = user_id;
                return [4 /*yield*/, addRowToTable('collections', collection)];
            case 4:
                collection_id = _a.sent();
                numberOfTaxa = getRandomInt(1, 29);
                taxaArray = generateFakeTaxa(numberOfTaxa);
                _i = 0, taxaArray_1 = taxaArray;
                _a.label = 5;
            case 5:
                if (!(_i < taxaArray_1.length)) return [3 /*break*/, 8];
                taxon_id = taxaArray_1[_i];
                return [4 /*yield*/, addRowToTable('collections_to_taxa', {
                        collection_id: collection_id,
                        taxon_id: taxon_id,
                    })];
            case 6:
                _a.sent();
                _a.label = 7;
            case 7:
                _i++;
                return [3 /*break*/, 5];
            case 8:
                userIds.push(user_id);
                _a.label = 9;
            case 9:
                j++;
                return [3 /*break*/, 3];
            case 10:
                i++;
                return [3 /*break*/, 1];
            case 11: return [2 /*return*/, userIds];
        }
    });
}); };
var dropTable = function (tableName) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, db.execute("DROP TABLE ".concat(tableName))];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
function addUserToDatabase(user) {
    return __awaiter(this, void 0, void 0, function () {
        var UNSAFEPassword, securePassword, safeUser;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    UNSAFEPassword = user.password;
                    securePassword = (0, bcrypt_ts_1.hashSync)(UNSAFEPassword, (0, bcrypt_ts_1.genSaltSync)(10));
                    safeUser = __assign(__assign({}, user), { password: securePassword });
                    return [4 /*yield*/, addRowToTable('user_data', safeUser)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function addRowToTable(tableName, data) {
    return __awaiter(this, void 0, void 0, function () {
        var columns, values, placeholders, result, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    columns = Object.keys(data).join(', ');
                    values = Object.values(data);
                    placeholders = values.map(function () { return '?'; }).join(', ');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, db.execute("INSERT INTO ".concat(tableName, " (").concat(columns, ") VALUES (").concat(placeholders, ")"), values)];
                case 2:
                    result = (_a.sent())[0];
                    return [2 /*return*/, result.insertId]; // Return the ID of the newly inserted record
                case 3:
                    error_1 = _a.sent();
                    console.error("Error creating record in ".concat(tableName, ":"), error_1);
                    throw error_1;
                case 4: return [2 /*return*/];
            }
        });
    });
}
var users = await createUsers(12);
var admin = await addUserToDatabase(adminUser);
if (admin) {
    console.log('Admin created successfully:');
    console.log(adminUser);
}
db.end();
// console.log(users)
// console.log(collections)
console.log(users);
// console.log(await addRowsToTable("collections",collections))
// console.log(await(fetchInatTaxa({q:"squirrel",})));

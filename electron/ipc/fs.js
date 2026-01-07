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
exports.registerIpcHandlers = registerIpcHandlers;
var module_1 = require("module");
var fs = require("fs/promises");
var path = require("path");
var require = (0, module_1.createRequire)(import.meta.url);
var electron = require("electron");
var ipcMain = electron.ipcMain, app = electron.app, dialog = electron.dialog;
function registerIpcHandlers() {
    var _this = this;
    // AppData handlers (simplified API for database)
    ipcMain.handle("fs:ensureAppDataDir", function () { return __awaiter(_this, void 0, void 0, function () {
        var userDataDir, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    userDataDir = app.getPath("userData");
                    return [4 /*yield*/, fs.mkdir(userDataDir, { recursive: true })];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    throw new Error("Failed to ensure app data directory: ".concat(error_1.message));
                case 3: return [2 /*return*/];
            }
        });
    }); });
    ipcMain.handle("fs:readAppDataJson", function (_event, filename) { return __awaiter(_this, void 0, void 0, function () {
        var userDataDir, filePath, content, error_2, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    if (typeof filename !== "string") {
                        throw new Error("Filename must be a string");
                    }
                    userDataDir = app.getPath("userData");
                    filePath = path.join(userDataDir, filename);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fs.readFile(filePath, "utf-8")];
                case 2:
                    content = _a.sent();
                    return [2 /*return*/, content];
                case 3:
                    error_2 = _a.sent();
                    // File doesn't exist, return null
                    if (error_2.code === "ENOENT") {
                        return [2 /*return*/, null];
                    }
                    throw error_2;
                case 4: return [3 /*break*/, 6];
                case 5:
                    error_3 = _a.sent();
                    throw new Error("Failed to read app data JSON: ".concat(error_3.message));
                case 6: return [2 /*return*/];
            }
        });
    }); });
    ipcMain.handle("fs:writeAppDataJson", function (_event, filename, content) { return __awaiter(_this, void 0, void 0, function () {
        var userDataDir, filePath, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    if (typeof filename !== "string") {
                        throw new Error("Filename must be a string");
                    }
                    if (typeof content !== "string") {
                        throw new Error("Content must be a string");
                    }
                    userDataDir = app.getPath("userData");
                    return [4 /*yield*/, fs.mkdir(userDataDir, { recursive: true })];
                case 1:
                    _a.sent();
                    filePath = path.join(userDataDir, filename);
                    return [4 /*yield*/, fs.writeFile(filePath, content, "utf-8")];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_4 = _a.sent();
                    throw new Error("Failed to write app data JSON: ".concat(error_4.message));
                case 4: return [2 /*return*/];
            }
        });
    }); });
    // FS handlers
    ipcMain.handle("fs:exists", function (_event, filePath) { return __awaiter(_this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    if (typeof filePath !== "string") {
                        throw new Error("Path must be a string");
                    }
                    return [4 /*yield*/, fs.access(filePath)];
                case 1:
                    _b.sent();
                    return [2 /*return*/, true];
                case 2:
                    _a = _b.sent();
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    ipcMain.handle("fs:readTextFile", function (_event, filePath) { return __awaiter(_this, void 0, void 0, function () {
        var content, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    if (typeof filePath !== "string") {
                        throw new Error("Path must be a string");
                    }
                    return [4 /*yield*/, fs.readFile(filePath, "utf-8")];
                case 1:
                    content = _a.sent();
                    return [2 /*return*/, content];
                case 2:
                    error_5 = _a.sent();
                    throw new Error("Failed to read file: ".concat(error_5.message));
                case 3: return [2 /*return*/];
            }
        });
    }); });
    ipcMain.handle("fs:writeTextFile", function (_event, filePath, content) { return __awaiter(_this, void 0, void 0, function () {
        var error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    if (typeof filePath !== "string") {
                        throw new Error("Path must be a string");
                    }
                    if (typeof content !== "string") {
                        throw new Error("Content must be a string");
                    }
                    return [4 /*yield*/, fs.writeFile(filePath, content, "utf-8")];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_6 = _a.sent();
                    throw new Error("Failed to write file: ".concat(error_6.message));
                case 3: return [2 /*return*/];
            }
        });
    }); });
    ipcMain.handle("fs:mkdir", function (_event, dirPath, options) { return __awaiter(_this, void 0, void 0, function () {
        var error_7;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    if (typeof dirPath !== "string") {
                        throw new Error("Path must be a string");
                    }
                    return [4 /*yield*/, fs.mkdir(dirPath, { recursive: (_a = options === null || options === void 0 ? void 0 : options.recursive) !== null && _a !== void 0 ? _a : true })];
                case 1:
                    _b.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_7 = _b.sent();
                    throw new Error("Failed to create directory: ".concat(error_7.message));
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Path handlers
    ipcMain.handle("path:userDataDir", function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, app.getPath("userData")];
        });
    }); });
    ipcMain.handle("path:join", function (_event) {
        var paths = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            paths[_i - 1] = arguments[_i];
        }
        return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!Array.isArray(paths) || paths.some(function (p) { return typeof p !== "string"; })) {
                    throw new Error("All paths must be strings");
                }
                return [2 /*return*/, path.join.apply(path, paths)];
            });
        });
    });
    // Dialog handlers
    ipcMain.handle("dialog:open", function (_event, options) { return __awaiter(_this, void 0, void 0, function () {
        var result, error_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, dialog.showOpenDialog({
                            title: (options === null || options === void 0 ? void 0 : options.title) || "Selecionar arquivo",
                            filters: (options === null || options === void 0 ? void 0 : options.filters) || [
                                { name: "Todos os arquivos", extensions: ["*"] },
                            ],
                            properties: (options === null || options === void 0 ? void 0 : options.multiple) ? ["openFile", "multiSelections"] : ["openFile"],
                        })];
                case 1:
                    result = _a.sent();
                    if (result.canceled) {
                        return [2 /*return*/, null];
                    }
                    return [2 /*return*/, result.filePaths];
                case 2:
                    error_8 = _a.sent();
                    throw new Error("Failed to open dialog: ".concat(error_8.message));
                case 3: return [2 /*return*/];
            }
        });
    }); });
}

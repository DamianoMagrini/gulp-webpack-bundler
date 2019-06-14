"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var constants_1 = __importDefault(require("constants"));
var VirtualStats = /** @class */ (function () {
    /**
     * Create a new stats object.
     * @param config Stats properties.
     * @constructor
     */
    function VirtualStats(config) {
        var _this = this;
        /**
         * Check if mode indicates property.
         * @param property Property to check.
         * @return Property matches mode.
         */
        this._checkModeProperty = function (property) {
            return (_this.mode & constants_1.default.S_IFMT) === property;
        };
        /**
         * @return Is a directory.
         */
        this.isDirectory = function () { return _this._checkModeProperty(constants_1.default.S_IFDIR); };
        /**
         * @return Is a regular file.
         */
        this.isFile = function () { return _this._checkModeProperty(constants_1.default.S_IFREG); };
        /**
         * @return Is a block device.
         */
        this.isBlockDevice = function () { return _this._checkModeProperty(constants_1.default.S_IFBLK); };
        /**
         * @return Is a character device.
         */
        this.isCharacterDevice = function () { return _this._checkModeProperty(constants_1.default.S_IFCHR); };
        /**
         * @return Is a symbolic link.
         */
        this.isSymbolicLink = function () { return _this._checkModeProperty(constants_1.default.S_IFLNK); };
        /**
         * @return Is a named pipe.
         */
        this.isFIFO = function () { return _this._checkModeProperty(constants_1.default.S_IFIFO); };
        /**
         * @return Is a socket.
         */
        this.isSocket = function () { return _this._checkModeProperty(constants_1.default.S_IFSOCK); };
        for (var key in config) {
            if (!config.hasOwnProperty(key)) {
                continue;
            }
            this[key] = config[key];
        }
    }
    return VirtualStats;
}());
exports.default = VirtualStats;

import constants from 'constants';

interface VirtualStats {
  _checkModeProperty: (property: number) => boolean;
  isDirectory: () => boolean;
  isFile: () => boolean;
  isBlockDevice: () => boolean;
  isCharacterDevice: () => boolean;
  isSymbolicLink: () => boolean;
  isFIFO: () => boolean;
  isSocket: () => boolean;
  [key: string]: any;
}

class VirtualStats {
  /**
   * Create a new stats object.
   * @param config Stats properties.
   * @constructor
   */
  constructor(config: any) {
    for (var key in config) {
      if (!config.hasOwnProperty(key)) {
        continue;
      }
      this[key] = config[key];
    }
  }
  /**
   * Check if mode indicates property.
   * @param property Property to check.
   * @return Property matches mode.
   */
  _checkModeProperty = (property: number): boolean =>
    (this.mode & constants.S_IFMT) === property;

  /**
   * @return Is a directory.
   */
  isDirectory = (): boolean => this._checkModeProperty(constants.S_IFDIR);

  /**
   * @return Is a regular file.
   */
  isFile = (): boolean => this._checkModeProperty(constants.S_IFREG);

  /**
   * @return Is a block device.
   */
  isBlockDevice = (): boolean => this._checkModeProperty(constants.S_IFBLK);

  /**
   * @return Is a character device.
   */
  isCharacterDevice = (): boolean => this._checkModeProperty(constants.S_IFCHR);

  /**
   * @return Is a symbolic link.
   */
  isSymbolicLink = (): boolean => this._checkModeProperty(constants.S_IFLNK);

  /**
   * @return Is a named pipe.
   */
  isFIFO = (): boolean => this._checkModeProperty(constants.S_IFIFO);

  /**
   * @return Is a socket.
   */
  isSocket = (): boolean => this._checkModeProperty(constants.S_IFSOCK);
}

export default VirtualStats;

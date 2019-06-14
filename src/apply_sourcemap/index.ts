import {
  RawSourceMap,
  SourceMapGenerator,
  SourceMapConsumer
} from 'source-map';

import Vinyl from 'vinyl';

export default async (file: Vinyl, source_map: RawSourceMap) => {
  if (file.sourceMap && typeof file.sourceMap === 'string') {
    file.sourceMap = JSON.parse(file.sourceMap);
  }

  // Convert Windows paths to POSIX paths.
  source_map.file = source_map.file.replace(/\\/g, '/');
  source_map.sources = source_map.sources.map(function(filePath) {
    return filePath.replace(/\\/g, '/');
  });

  if (file.sourceMap && file.sourceMap.mappings !== '') {
    var generator = SourceMapGenerator.fromSourceMap(
      await new SourceMapConsumer(source_map)
    );
    generator.applySourceMap(await new SourceMapConsumer(file.sourceMap));
    file.sourceMap = JSON.parse(generator.toString());
  } else {
    file.sourceMap = source_map;
  }
};

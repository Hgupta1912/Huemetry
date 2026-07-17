const { getPixelData } = require('../lib/imageProcessing.js');
const { extractPalette, groupColorsByTonalRange } = require('../lib/extractPalette.js');
const { computeImageStatistics } = require('../lib/imageStatistics.js');
const { compareToReference } = require('../lib/compareToReference.js');

const analyze = async (req, res, next) => {
  try {
    const imageFile = req.files?.image?.[0];
    const referenceFile = req.files?.referenceImage?.[0];

    if (!imageFile) {
      return res.status(400).json({ error: 'An image file is required' });
    }

    const isMonochrome = req.body.isMonochrome === 'true' || req.body.isMonochrome === true;

    const { pixels } = await getPixelData(imageFile.buffer);
    const statistics = computeImageStatistics(pixels, isMonochrome);
    const palettes = isMonochrome ? null : extractPalette(pixels);

    let comparison = null;
    if (referenceFile) {
      const { pixels: refPixels } = await getPixelData(referenceFile.buffer);
      const referenceStatistics = computeImageStatistics(refPixels, isMonochrome);
      const referencePalettes = isMonochrome ? null : extractPalette(refPixels);

      if (!isMonochrome) {
        comparison = compareToReference(
          { palettes: referencePalettes, statistics: referenceStatistics },
          { palettes, statistics },
        );
      }

      return res.status(200).json({
        image: { statistics, palettes },
        reference: { statistics: referenceStatistics, palettes: referencePalettes },
        comparison,
      });
    }

    res.status(200).json({ image: { statistics, palettes } });
  } catch (err) {
    next(err);
  }
};

module.exports = { analyze };
# Library for simple nonparametric confidence intervals

This library calculates conservative nonparametric confidence intervals of the
expected value (also known as mean or average) based on observations. It works
great to calculate confidence intervals for the true average product rating
based on known ratings, for example.

Install by copying into your project for now. See unit tests for detailed usage.

Example usage::

    const confidence = require('./confidence');

    const ratings = {
      1: 0, 2: 3, 3: 9, 4: 53, 5: 144,
    };

    const [lower, upper] = confidence.calculateConfidenceInterval(ratings, 0.95);

    expect(lower).toBeCloseTo(4.24);
    expect(upper).toBeCloseTo(4.78);

Tests and ESLint can be run through npm run test or using e.g. the Jest and
ESLint plugins for VS Code.

See LICENSE.txt for the license (Apache 2.0).
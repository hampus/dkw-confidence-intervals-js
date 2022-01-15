/*
 * Copyright 2022 Hampus Wessman
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

class ConfidenceIntervalError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfidenceIntervalError';
  }
}

class InvalidConfidenceLevel extends ConfidenceIntervalError {
  constructor(message) {
    super(message);
    this.name = 'InvalidConfidenceLevel';
  }
}

function count(data) {
  return Object.values(data).reduce((a, b) => a + b, 0);
}

function clamp(value, min, max) {
  return Math.max(Math.min(value, max), min);
}

function validateValues(xs) {
  xs.map(x => {
    if (x !== 0 && !x) {
      throw new ConfidenceIntervalError(`Invalid data value: ${x}`);
    }
  });
}

function validateFrequencies(freqs) {
  freqs.map(x => {
    if (x === NaN || x < 0) {
      throw new ConfidenceIntervalError(`Invalid frequency: ${x}`);
    }
  });
}

class CDF {
  constructor(data) {
    if (data) {
      this.xs = Object.keys(data).map(x => parseFloat(x)).sort();
      validateValues(this.xs);
      const freqs = this.xs.map(x => parseInt(data[x], 10));
      validateFrequencies(freqs);
      this.N = count(freqs);
      this.ys = [];
      let sum = 0;
      for (let i = 0; i < freqs.length; i++) {
        sum += freqs[i];
        this.ys.push(sum / this.N);
      }
    } else {
      this.xs = [];
      this.ys = [];
      this.N = 0;
    }
  }

  shift(offset) {
    const result = new CDF();
    result.xs = this.xs;
    result.N = this.N;
    for (let i = 0; i < this.xs.length; i++) {
      result.ys.push(clamp(this.ys[i] + offset, 0.0, 1.0));
    }
    if (result.ys.length) {
      // No bigger values are possible, so must be 1.0 in the final element.
      result.ys[result.ys.length - 1] = 1.0;
    }
    return result;
  }

  expectedValue() {
    if (this.xs.length == 0 || this.N <= 0) {
      return undefined;
    } else if (this.xs.length == 1) {
      return this.xs[0];
    }

    let expectedValue = this.xs[0] * this.ys[0];
    for (let i = 1; i < this.xs.length; i++) {
      expectedValue += this.xs[i] * (this.ys[i] - this.ys[i - 1]);
    }
    return expectedValue;
  }
}

/**
 * Calculate a confidence interval for the expected value.
 *
 * The data must include the largest and smallest possible values even if their
 * frequencies are zero. The data must be an object with numeric keys and
 * integer values. The keys are possible values in the sample and the integer
 * values are their frequencies. The frequency is the number of instances of
 * that value in the sample.
 *
 * @param {dict} data - sample data as a dict from value to frequency.
 * @param {number} confidenceLevel - confidence level as a number between 0.5
 * and 1.0.
 * @returns array of lower and upper bound as numbers.
 */
function calculateConfidenceInterval(data, confidenceLevel) {
  const level = parseFloat(confidenceLevel);
  if (!level || confidenceLevel < 0.5 || confidenceLevel > 1.0) {
    throw new InvalidConfidenceLevel('The confidence level must be between 0.5 and 1.0');
  }
  const cdf = new CDF(data);
  const alpha = 1.0 - level;
  const epsilon = Math.sqrt(1 / (2 * cdf.N) * Math.log(2 / alpha));
  const U = cdf.shift(epsilon);
  const L = cdf.shift(-epsilon);
  return [U.expectedValue(), L.expectedValue()];
}

exports.count = count;
exports.CDF = CDF;
exports.ConfidenceIntervalError = ConfidenceIntervalError;
exports.InvalidConfidenceLevel = InvalidConfidenceLevel;
exports.calculateConfidenceInterval = calculateConfidenceInterval;

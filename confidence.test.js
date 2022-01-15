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
const confidence = require('./confidence');

test('Invalid confidence levels throws error', () => {
  expect(() => confidence.calculateConfidenceInterval({}, 0.45)).toThrow(confidence.InvalidConfidenceLevel);
  expect(() => confidence.calculateConfidenceInterval({}, 1.1)).toThrow(confidence.InvalidConfidenceLevel);
  expect(() => confidence.calculateConfidenceInterval({}, "text")).toThrow(confidence.InvalidConfidenceLevel);
});

test('Counting works as expected', () => {
  expect(confidence.count({ 1: 0, 2: 4, 5: 3 })).toEqual(7);
});

test('Can create simple CDF', () => {
  const data = {
    7: 2,
    3: 0,
    0: 1,
    5: 1,
  };
  const cdf = new confidence.CDF(data);
  expect(cdf.xs).toEqual([0, 3, 5, 7]);
  expect(cdf.ys).toEqual([0.25, 0.25, 0.5, 1.0]);
});

test('Can shift CDF downwards', () => {
  const data = {
    7: 2,
    3: 0,
    0: 1,
    5: 1,
  };
  const cdf = new confidence.CDF(data);
  const cdf2 = cdf.shift(-0.25);
  expect(cdf.xs).toEqual([0, 3, 5, 7]);
  expect(cdf.ys).toEqual([0.25, 0.25, 0.5, 1.0]);
  expect(cdf2.xs).toEqual([0, 3, 5, 7]);
  expect(cdf2.ys).toEqual([0.0, 0.0, 0.25, 1.0]);
});

test('Can shift CDF upwards', () => {
  const data = {
    7: 2,
    3: 0,
    0: 1,
    5: 1,
  };
  const cdf = new confidence.CDF(data);
  const cdf2 = cdf.shift(0.25);
  expect(cdf.xs).toEqual([0, 3, 5, 7]);
  expect(cdf.ys).toEqual([0.25, 0.25, 0.5, 1.0]);
  expect(cdf2.xs).toEqual([0, 3, 5, 7]);
  expect(cdf2.ys).toEqual([0.5, 0.5, 0.75, 1.0]);
});

test('Can calculate expected value of CDF', () => {
  const data = {
    7: 2,
    3: 0,
    0: 1,
    5: 1,
  };
  const cdf = new confidence.CDF(data);
  expect(cdf.xs).toEqual([0, 3, 5, 7]);
  expect(cdf.ys).toEqual([0.25, 0.25, 0.5, 1.0]);
  expect(cdf.expectedValue()).toBeCloseTo(0.25 * 5 + 0.5 * 7);
});

test('Basic usage', () => {
  const ratings = {
    1: 0, 2: 3, 3: 9, 4: 53, 5: 144,
  };
  const [lower, upper] = confidence.calculateConfidenceInterval(ratings, 0.95);
  expect(lower).toBeCloseTo(4.24);
  expect(upper).toBeCloseTo(4.78);
});

test('Negative frequences throw exception', () => {
  const ratings = {
    1: 0, 2: 3, 3: 9, 4: -1, 5: 144,
  };
  expect(() => confidence.calculateConfidenceInterval(ratings, 0.95))
    .toThrow(confidence.ConfidenceIntervalError);
});

test('Non-numeric data valudes throw exception', () => {
  const ratings = {
    text: 0, text2: 1, 2: 3,
  };
  expect(Object.keys(ratings).sort()).toEqual(['2', 'text', 'text2'])
  expect(Object.keys(ratings).sort().map(x => parseFloat(x))).toEqual([2, NaN, NaN])
  expect(() => confidence.calculateConfidenceInterval(ratings, 0.95))
    .toThrow(confidence.ConfidenceIntervalError);
});

test('Empty data return undefined confidence interval', () => {
  const ratings = {};
  const [lower, upper] = confidence.calculateConfidenceInterval(ratings, 0.95);
  expect(lower).toBeUndefined();
  expect(upper).toBeUndefined();
});

test('Single possible value gives full confidence', () => {
  const ratings = { 12: 10 };
  const [lower, upper] = confidence.calculateConfidenceInterval(ratings, 0.95);
  expect(lower).toBeCloseTo(12);
  expect(upper).toBeCloseTo(12);
});

test('Small sample gives back maximum uncertainty', () => {
  const ratings = { 1: 1, 5: 0 };
  const [lower, upper] = confidence.calculateConfidenceInterval(ratings, 0.95);
  expect(lower).toBeCloseTo(1.0);
  expect(upper).toBeCloseTo(5.0);
});

test('Large sample gives back very small interval', () => {
  const ratings = { 1: 0, 5: 10000000 };
  const [lower, upper] = confidence.calculateConfidenceInterval(ratings, 0.95);
  expect(lower).toBeCloseTo(5.0);
  expect(upper).toBeCloseTo(5.0);
});

test('Higher confidence level makes interval larger', () => {
  const ratings = { 1: 0, 5: 1000 };
  const interval0 = confidence.calculateConfidenceInterval(ratings, 0.80);
  const interval1 = confidence.calculateConfidenceInterval(ratings, 0.99);
  expect(interval0[1] - interval0[0]).toBeLessThan(interval1[1] - interval1[0]);
});

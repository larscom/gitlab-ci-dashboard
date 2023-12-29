module.exports = {
  preset: 'jest-preset-angular',
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$|@ngneat|ng-zorro-antd)'],
  moduleNameMapper: {
    '\\$groups/(.*)': '<rootDir>/src/app/groups/$1',
    '\\$header/(.*)': '<rootDir>/src/app/header/$1',
    '\\$service/(.*)': '<rootDir>/src/app/service/$1',
    '\\$store/(.*)': '<rootDir>/src/app/store/$1'
  }
}

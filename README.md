# @ijstech/cli
Command line tool to create new package for Secure Compute framework.

# Usage
### Step 1: Create a new folder
```sh
mkdir demo
cd demo
```
 
### Step 2: Initialize a worker/router package
```sh
npx @ijstech/cli init <worker/router/contract/dapp> <name>
e.g.: npx @ijstech/cli init worker @scom/demo1
```
 
### Step 3: Install package dependencies
```sh
npm i
```
or
```sh
docker-compose up install
```

### Step 4: Run unit test
```sh
npm run test
```
or
```sh
docker-compose up test
```
### Step 5: Build package
```sh
npm run build
```
or
```sh
docker-compose up build
```

var axios = require("axios");
var fs = require("fs");
var path = require("path");
var inquirer = require("inquirer");
var autocomplete = require("inquirer-autocomplete-prompt");
inquirer.registerPrompt("autocomplete", autocomplete);

start();

async function getGitignoreList() {
  var gitignorePath = path.resolve(__dirname, "gitignore.json");
  if (fs.existsSync(gitignorePath)) {
    const fileString = fs.readFileSync(gitignorePath, { encoding: "utf-8" });

    return JSON.parse(fileString);
  }

  try {
    console.log("get gitignore list for github.com ...");

    var { data } = await axios.get(
      "https://api.github.com/repos/github/gitignore/contents"
    );

    var gitignoreList = data
      .filter(item => /.gitignore/g.test(item.name))
      .map(item => item.name.replace(".gitignore", ""));

    var writeString = JSON.stringify(gitignoreList);

    fs.writeFileSync(gitignorePath, writeString, { encoding: "utf-8" });

    return gitignoreList;
  } catch (err) {
    console.log(err);
    process.exit();
  }
}

async function start() {
  let gitignore;

  try {
    const gitignoreList = await getGitignoreList();
    const { gitignoreName } = await inquirer.prompt([
      {
        type: "autocomplete",
        name: "gitignoreName",
        message: "selected type for .gitignore",
        source: function(answersSoFar, input) {
          return new Promise((resolve, reject) => {
            const filterData = gitignoreList.filter(item =>
              new RegExp(input, "g", "i").test(item)
            );
            resolve(filterData);
          });
        }
      }
    ]);
    gitignore = gitignoreList.find(item => item === gitignoreName);
  } catch (err) {
    console.log(err);
    process.exit();
  }

  try {
    console.log("download... .gitignore");
    const downloadURL = `https://raw.githubusercontent.com/github/gitignore/master/${gitignore}.gitignore`;
    const outPath = "./.gitignore";
    const { data } = await axios.get(downloadURL);

    fs.writeFileSync(outPath, data, { encoding: "utf-8" });

    console.log("create .gitignore success");
  } catch (err) {
    console.log("download error");
    process.exit();
  }
}

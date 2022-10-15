const fs = require("fs");
const args = process.argv.slice(2);
const inputFolder = args[0];
const dir = `${__dirname}/${inputFolder}/`;
const inputFiles = fs.readdirSync(dir).sort();

inputFiles.forEach((file) => {
  let id = file.split(".").shift();
  let data = JSON.parse(fs.readFileSync(`${dir}/${file}`));
  
  data.name = `Sloth`;
  data.image = `https://gateway.pinata.cloud/ipfs/QmUL6rRhcnEjY83iDnYav25piCnfE1F3TqawjszAQsbRJK`;
  
  fs.writeFileSync(`${dir}/${file}`, JSON.stringify(data, null, 2));
  console.log(data);
  });
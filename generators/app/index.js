const Generator = require('yeoman-generator');

module.exports = class extends Generator {
  async prompting() {
    this.answers = await this.prompt([
      {
        type: 'checkbox',
        name: 'files',
        message: 'Which sample files would you like to include?',
        choices: [
          {name: 'README.md', value: 'readme', checked: true},
          {name: 'Dockerfile', value: 'dockrefile'},
          {name: 'Bitbucket-pipelines', value: 'pipelines'},
        ],
      },
    ]);
  }

  writing() {
    this.spawnCommandSync('dotnet', ['new', 'console', '-n', 'SampleProject']);
  
    if (this.answers.files.includes('readme')) {
      this.fs.write(this.destinationPath('SampleProject/README.md'), '# Sample Project');
    }
  
    if (this.answers.files.includes('classFile')) {
      this.fs.write(this.destinationPath('SampleProject/MyClass.cs'), 'public class MyClass {}');
    }
  
    if (this.answers.files.includes('interfaceFile')) {
      this.fs.write(this.destinationPath('SampleProject/IMyInterface.cs'), 'public interface IMyInterface {}');
    }
  }
  


};

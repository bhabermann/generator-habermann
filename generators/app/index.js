const url = require('url');
const Generator = require('yeoman-generator');

const normalizeAppName = (name) => {
  const normalized = name.toLocaleLowerCase()
    .split(' ')
    .map(s => s.charAt(0).toUpperCase() + s.substring(1))
    .join('.');

  return `CarMax.${normalized}`;
}

module.exports = class extends Generator {

  initializing() {
    this.log("New project huh? We've got you covered, just answer a few questions...");
  }

  async prompting() {
    this.answers = await this.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'What is the name of your project?',
        default: normalizeAppName(this.appname),
        prefix: ''
      },
      {
        type: 'input',
        name: 'solutionName',
        message: 'What is the name of your solution?',
        default: normalizeAppName(this.appname),
        prefix: ''
      },
      {
        type: 'list',
        name: 'projectType',
        message: 'What kind of project?',
        choices: [
          'webapi',
          'mvc',
          'web',
          'console'
        ],
        prefix: ''
      },
      {
        type: 'confirm',
        name: 'createUnitTests',
        message: 'Would you like a unit test project?',
        default: true,
        when: (answers) => !!answers.projectType,
        prefix: ''
      },
      {
        type: 'confirm',
        name: 'createEditorConfig',
        message: 'Would you like an .editorconfig?',
        default: true,
        prefix: ''
      },
      {
        type: 'confirm',
        name: 'createNugetConfig',
        message: 'Do you need to install private nuget packages?',
        default: false,
        prefix: ''
      },
      {
        type: 'input',
        name: 'nugetSource',
        message: 'What is the url to the private nuget server?',
        when: (answers) => answers.createNugetConfig,
        prefix: ''
      },
    ]);

    this.log('Provisioning started!');
  }

  configuring() {
    if (this.answers.createEditorConfig) {
      this.log('Adding .editorconfig')
      this.fs.copy(
        this.templatePath('editorconfig.template'),
        this.destinationPath('.editorconfig')
      );
    }

    if (this.answers.createNugetConfig) {
      this.log('Adding nuget.config')
      const nugetUrl = url.parse(this.answers.nugetSource);
      this.fs.copyTpl(
        this.templatePath('nuget.template'),
        this.destinationPath('nuget.config'),
        {
          label: nugetUrl.hostname,
          url: nugetUrl.href
        }
      );
    }

    this.log('Adding .vscode to .gitignore')
    this.fs.copy(
      this.templatePath('gitignore.template'),
      this.destinationPath('.gitignore')
    );

    this.log('Adding readme.md file');
    this.fs.copyTpl(
      this.templatePath('readme.template'),
      this.destinationPath('readme.md'),
      {
        title: this.answers.projectName
      }
    );
  }

  dotnet() {

    this.log('Creating a solution file...');
    this.spawnCommandSync('dotnet',
      [
        'new',
        'sln',
        '--name',
        this.answers.solutionName
      ],
      {
        cwd: this.destinationRoot()
      }
    );

    if (this.answers.projectType) {
      this.log(`Creating ${this.answers.projectType} project...`);
      this.spawnCommandSync('dotnet',
        [
          'new',
          this.answers.projectType,
          '--name',
          this.answers.projectName,
          '--output',
          `src/${this.answers.projectName}`
        ],
        {
          cwd: this.destinationRoot()
        }
      );

      this.log(`Adding ${this.answers.projectName} to solution...`);
      this.spawnCommandSync('dotnet', [
        'sln',
        'add',
        `src/${this.answers.projectName}`
      ], {
          cwd: this.destinationRoot()
        });

      // delete development app seettings
      const develomentAppSettingsPath = this.destinationPath(
        `src/${this.answers.projectName}/appsettings.Development.json`
      );

      if(this.fs.exists(develomentAppSettingsPath)) {
        this.fs.delete(develomentAppSettingsPath);
      }

      // add environment name to appsettings
      const appSettingsPath = this.destinationPath(
        `src/${this.answers.projectName}/appsettings.json`
      );

      if(this.fs.exists(appSettingsPath)) {
        this.fs.extendJSON(appSettingsPath, { "Environment": "local" });
      }
    }

    if (this.answers.createUnitTests) {
      const unitTestProjectName = `${this.answers.projectName}.Tests.Unit`;
      const unitTestProjectPath = `tests/${unitTestProjectName}`;
      this.log(`Creating ${unitTestProjectName} project...`);
      this.spawnCommandSync('dotnet',
        [
          'new',
          'xunit',
          '--name',
          unitTestProjectName,
          '--output',
          unitTestProjectPath
        ],
        {
          cwd: this.destinationRoot()
        }
      );

      this.log(`Adding reference to ${this.answers.projectName} to test project...`);
      this.spawnCommandSync('dotnet',
        [
          'add',
          unitTestProjectPath,
          'reference',
          `src/${this.answers.projectName}`
        ],
        {
          cwd: this.destinationRoot()
        }
      );

      this.log(`Adding Moq to test project...`);
      this.spawnCommandSync('dotnet',
        [
          'add',
          unitTestProjectPath,
          'package',
          'Moq'
        ],
        {
          cwd: this.destinationRoot()
        }
      );

      this.log(`Adding unitTestProjectName to solution...`);
      this.spawnCommandSync('dotnet', [
        'sln',
        'add',
        unitTestProjectPath
      ], {
          cwd: this.destinationRoot()
        });
    }
  }
};
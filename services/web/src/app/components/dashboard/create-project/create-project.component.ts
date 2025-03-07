import { Component, OnInit } from '@angular/core';
import { Project } from '../../../interfaces/project/project';
import { ProjectApiRequesterService } from '../../../services/project-api-requester/project-api-requester.service';
import { NotifierService } from 'angular-notifier';
import { ApiResponse } from '../../../interfaces/api-response/api-response';

@Component({
  selector: 'app-create-project',
  templateUrl: './create-project.component.html',
  styleUrls: ['./create-project.component.css']
})
export class CreateProjectComponent implements OnInit {

  project: Project = new Project();

  blacklistword: string = "";
  whitelistword: string = "";


  constructor(private projectApi: ProjectApiRequesterService,
      private notifierService: NotifierService) {
  }

  ngOnInit() {
  }

  removeWhitelistWord(index: number) {
    this.project.whitelist.splice(index, 1);
  }

  removeBlacklistWord(index: number) {
    this.project.blacklist.splice(index, 1);
  }

  addWhitelistWord() {
    const word = this.whitelistword.trim();

    if (word === '') {
      this.whitelistword = '';
      return;
    }

    this.project.whitelist.push(this.whitelistword);
    this.whitelistword = '';
  }

  addBlacklistWord() {
    const word = this.blacklistword.trim();

    if (word === '') {
      this.blacklistword = '';
      return;
    }
    
    this.project.blacklist.push(this.blacklistword);
    this.blacklistword = '';
  }

  compareSource(op1: any, op2: any) {
    return op1 === op2;
  }

  onCreateClick() {
    this.projectApi.createProject(this.project).subscribe(
      (response: ApiResponse) => {
        if (response == undefined || response == null) {
        }
        
        this.project = new Project();
        this.whitelistword = "";
        this.blacklistword = "";
      }
    );
  }
}

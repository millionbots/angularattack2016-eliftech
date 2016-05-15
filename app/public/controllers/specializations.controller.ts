import {Component} from '@angular/core';
import {CORE_DIRECTIVES, Location} from '@angular/common';
import {ROUTER_DIRECTIVES, RouteParams} from '@angular/router-deprecated';

import {LoadingContainerComponent} from '../../components/loading-container.component';
import {GithubService} from '../../services/github.service';
import {ProfessionService} from '../../services/profession.service';
import {Level} from '../../models/level.model';
import {Profession} from '../../models/profession.model';
import {LevelItem} from '../../models/level-item.model';
import {toArray} from 'lodash';

@Component({
    templateUrl: '/views/specializations.html',
    directives: [
        LoadingContainerComponent,
        CORE_DIRECTIVES
    ],
    providers: [
        GithubService,
        ProfessionService
    ]
})
export class PublicSpecializationsController {
    public items:any[];
    public loading:boolean;
    public selectedLevel:Level;
    public professionName:string = '';
    public levelName:string = '';
    public currTag:string = '';
    public currLevelIems:LevelItem[];
    public profession:Profession;

    constructor(private github:GithubService, private location:Location,
                private professionService:ProfessionService,
                private params:RouteParams) {
        this.loading = true;

        github.getCurrentRepository().getTree(res => {
            // console.info(res);

            var nodes = {};

            res = res.map(item => {
                item.data.pathParts = item.data.path.replace(/\.md/g, '').split('/');

                return item;
            });

            let plain = {};

            res.map(item => {
                let lvl = item.data.pathParts.length;

                item.parent = lvl - 2 >= 0 ? item.data.pathParts[lvl - 2] : '';
                item.id = item.data.pathParts[lvl - 1];

                plain[item.data.pathParts[lvl - 1]] = item;
            });

            var plainToTree = (dic, node) => {
                let children = [];

                if (dic) {
                    var k;
                    for (k in dic) {
                        let v = plain[k];

                        if (v['parent'] === node['id']) {
                            let child = plainToTree(dic, v);

                            if (child)
                                children.push(child);
                        }
                    }
                }

                if (children)
                    node['children'] = children;

                return node;
            };

            var k;
            for (k in plain) {
                let node = plain[k];

                if (!node['parent'])
                    nodes[node['id']] = plainToTree(plain, node);
            }

            this.items = toArray(nodes['professions']['children']);
            console.log(this.items);
            // this.items = toArray(nodes);
            this.loading = false;
        });

        console.log('params', this.params);
        if (this.params.get('specialization')) {
            this.professionName = decodeURIComponent(this.params.get('specialization'));
        }
        if (this.params.get('degree')) {
            this.levelName = decodeURIComponent(this.params.get('degree'));
        }
        if (this.params.get('tag')) {
            this.currTag = decodeURIComponent(this.params.get('tag'));
        }
        this.loadLevelItems();
    }

    public filterByTag(tag:string) {
        this.currTag = tag;
        if (tag.length > 0) {
            this.location.replaceState('/', '?specialization=' + this.professionName + '&degree=' + this.levelName +
                '&tag=' + this.currTag);
        } else {
            this.location.replaceState('/', '?specialization=' + this.professionName + '&degree=' + this.levelName);
        }
        // this.loadLevelItems();

        this.selectedLevel.items = this.currLevelIems.filter((item) => {
            if (this.currTag.length > 0) {
                item.tags = item.tags || [];
                return item.tags.indexOf(this.currTag) != -1;
                // console.log('tag', this.tag, item);
            }
            return true;
        }).map((item:any) => {
            return new LevelItem(item);
        });
    }

    public getLevelItems(professionName:string, levelName:string) {
        this.professionName = professionName;
        this.levelName = levelName;

        this.location.replaceState('/', '?specialization=' + this.professionName + '&degree=' + this.levelName);
        this.loadLevelItems();
    }

    protected loadLevelItems() {
        console.log('getLevelItems', this.professionName, this.levelName);

        if (this.professionName.length > 0 && this.levelName.length > 0) {
            this.professionService
                .getByName(this.professionName)
                .then((profession) => {
                    this.profession = profession;
                    this.loading = false;
                    // console.log('this.profession', this.profession);
                });

            this.selectedLevel = new Level({
                name: this.levelName
            });

            this.loading = true;
            this.professionService
                .getLevelItems(this.professionName, this.levelName)
                .then((levelItems) => {
                    console.log('levelItems', levelItems);
                    this.currLevelIems = levelItems;
                    this.selectedLevel.items = levelItems.filter((item) => {
                        if (this.currTag.length > 0) {
                            item.tags = item.tags || [];
                            return item.tags.indexOf(this.currTag) != -1;
                            // console.log('tag', this.tag, item);
                        }
                        return true;
                    }).map((item:any) => {
                        return new LevelItem(item);
                    });
                    this.loading = false;
                });
        }
    }
}
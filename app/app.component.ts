import {Component} from '@angular/core';
import {RouterOutlet, RouteConfig, ROUTER_DIRECTIVES, Router} from '@angular/router-deprecated';
import {APP_ROUTES} from './app.routes';
import {LoggerService} from './services/logger.service';
import {AuthService} from './services/auth.service';
import {UserModel} from "./models/user.model";
import {Auth} from 'ng2-ui-auth';
import {GithubService} from "./services/github.service";
import {ToastrService} from "./services/toastr.service";

@Component({
    selector: 'as-main-app',
    templateUrl: '/views/app.html',
    directives: [
        RouterOutlet,
        ROUTER_DIRECTIVES
    ]
})
@RouteConfig(APP_ROUTES)
export class AppComponent {
    private user: UserModel;

    private auth: Auth;

    constructor(private authService:AuthService, public githubService: GithubService, public router: Router, private toastr: ToastrService) {
        authService.init();

        this.auth = AuthService.auth;
        AuthService.user$.subscribe(user => {
            this.user = user;
        });
    }

    logout() {
        this.authService.logout().subscribe(() => {
            this.goToMain();
        });
    }

    authenticate(provider: string) {
        this.auth.authenticate(provider)
            .subscribe((res) => {
                AuthService.setProvider(provider);
                this.authService.loadUserInfo();
                this.goToMain();
            });
    }
    
    goToMain() {
        this.router.navigate(['PublicSpecializations']);
    }
}

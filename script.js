let apiBaseUrl = "https://api.sprax2013.de/skindb";

console.log("BOOP!")

let skinApp = angular.module("skinApp", ["ui.router", "ui.materialize", "angularModalService"]);

skinApp.directive("ngPreloadSrc", function () {
    return {
        restrict: "A",
        replace: true,
        link: function (scope, element, attrs) {
            var $preloader = $("<img style='display:none'>");
            $preloader.attr("src", attrs.ngPreloadSrc);
            $preloader.on("load", function () {
                element.attr("src", attrs.ngPreloadSrc);
                $preloader.remove();
            });
            $preloader.on("error", function () {
                if (attrs.ngPreloadFallback) {
                    element.attr("src", attrs.ngPreloadFallback);
                }
                $preloader.remove();
            });
            $preloader.appendTo(element);
        }
    }
});

skinApp.config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
    // $locationProvider.html5Mode(true);
    $urlRouterProvider.otherwise('/');
    $stateProvider
        .state("index", {
            url: "/",
            templateUrl: "pages/overview.html",
            controller: "overviewController"
        })
        .state("index.view", {
            url: "^/{id:[A-Za-z0-9]{1,10}}",
            onEnter: ["$state", "$stateParams", "ModalService", function ($state, $stateParams, ModalService) {
                console.info("onEnter");
                console.log($stateParams);
                if (!$stateParams.id) return;

                ModalService.showModal({
                    templateUrl: "pages/view.html",
                    controller: "viewController",
                    inputs: {
                        '$stateParams': $stateParams
                    }
                }).then(function (modal) {
                    console.log(modal);
                    M.Modal.init(modal.element,{
                        onOpenEnd: function () {
                            console.log("onOpenEnd");
                        },
                        onCloseEnd: function () {
                            console.log("onCloseEnd");
                            $(".modal").remove()
                            $state.go("^");
                        }
                    })
                    modal.element.modal("open");

                })
            }],
            onExit: ["$state", function ($state) {
                console.info("onExit")
            }]
        })

});


skinApp.controller("viewController", ["$scope", "$http", "$timeout", "$interval", "$stateParams", "$sce", function ($scope, $http, $timeout, $interval, $stateParams, $sce) {
    console.info("viewController");

    $scope.defaultAvailableTags = ["nude", "male", "female", "nsfw", "sfw"];

    $scope.skinId = $stateParams.id;
    $scope.skin = {};
    $scope.previewUrl = "";
    $scope.previewMinerenderUrl = "";
    $http({
        url: apiBaseUrl + "/provide/status?id=" + $scope.skinId
    }).then(function (response) {
        $scope.skin = response.data;

        $scope.previewUrl = $sce.trustAsResourceUrl($scope.skin.SkinData);
        $scope.previewMinerenderUrl = $sce.trustAsResourceUrl("https://minerender.org/embed/skin/?skin.url=" + $scope.skin.SkinData + "&shadow=true&autoResize=true&controls.pan=false&controls.zoom=false");
    });

    $scope.availableTags = $scope.defaultAvailableTags;
    $scope.selectedTags = [];
    $scope.isTagSelected = function (tag) {
        return $scope.selectedTags.indexOf(tag) >= 0;
    };
    $scope.toggleTagSelection = function (tag) {
        if ($scope.tagsSubmitted) return;

        let i = $scope.selectedTags.indexOf(tag);
        if (i >= 0) {
            $scope.selectedTags.splice(i, 1);
        } else {
            $scope.selectedTags.push(tag);
        }
        console.log($scope.selectedTags);
    };
    $scope.tagsSubmitted = false;
    $scope.submitTagSelection = function () {

        //TODO

        $scope.tagsSubmitted = true;
        //
        // $timeout(function () {
        //     $scope.showRandomSkin();
        // }, 2000);
    };
}]);

skinApp.controller("overviewController", ["$scope", "$http", "$timeout", "$interval", "$stateParams", "$sce", function ($scope, $http, $timeout, $interval, $stateParams, $sce) {
    console.info("overviewController")

    $scope.skinUrl = "";
    $scope.skinSubmitted = false;
    $scope.addSkin = function () {
        if ($scope.skinUrl.length < 40) return;
        if (!$scope.skinUrl.startsWith("http")) return;
        if ($scope.skinUrl.indexOf("://textures.minecraft.net/texture/") === -1) return;

        $http({
            url: apiBaseUrl + "/provide?skin" + $scope.skinUrl
        }).then(function (response) {
            $scope.skinUrl = "";
            $scope.skinSubmitted = true;
            $timeout(function () {
                $scope.skinSubmitted = false;
            }, 2000);
        });
    };



    $scope.searchQuery = "";
    $scope.searchResults = [];
    $scope.searchQueryChanged = debounce(function () {
        if ($scope.searchQuery.length === 0) {
            $scope.showRandomSkins();
        } else {
            $http({
                url: apiBaseUrl + "/skin/search?count=12&q=" + $scope.searchQuery
            }).then(function (response) {
                $scope.searchResults = response.data;
            });
        }
    }, 500);

    // $scope.previewUrl = "";
    // $scope.previewMinerenderUrl = "";
    // $scope.updatePreviewUrl = function (url) {
    //     $scope.previewUrl = $sce.trustAsResourceUrl(url);
    //     $scope.previewMinerenderUrl = $sce.trustAsResourceUrl("https://minerender.org/embed/skin/?skin.url=" + url + "&shadow=true&autoResize=true&controls.pan=false&controls.zoom=false");
    // }

    $scope.showRandomSkins = function () {
        $http({
            url: apiBaseUrl + "/skin/random?count=12"
        }).then(function (response) {
            // $scope.updatePreviewUrl(response.data[0]["MojangURL"])
            $scope.searchResults = response.data;
        });
        $scope.tagsSubmitted = false;
        $scope.availableTags = $scope.defaultAvailableTags;
        $scope.selectedTags = [];
        $scope.searchQuery = "";
    }

    $scope.loadSkinList = function () {
        //TODO
    }

}]);

skinApp.controller("skinController", ["$scope", "$http", "$timeout", "$interval", "$stateParams", "$sce", function ($scope, $http, $timeout, $interval, $stateParams, $sce) {

}]);

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate) {
    var timeout;
    return function () {
        var context = this, args = arguments;
        var later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};


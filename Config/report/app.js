var app = angular.module('reportingApp', []);

//<editor-fold desc="global helpers">

var isValueAnArray = function (val) {
    return Array.isArray(val);
};

var getSpec = function (str) {
    var describes = str.split('|');
    return describes[describes.length - 1];
};
var checkIfShouldDisplaySpecName = function (prevItem, item) {
    if (!prevItem) {
        item.displaySpecName = true;
    } else if (getSpec(item.description) !== getSpec(prevItem.description)) {
        item.displaySpecName = true;
    }
};

var getParent = function (str) {
    var arr = str.split('|');
    str = "";
    for (var i = arr.length - 2; i > 0; i--) {
        str += arr[i] + " > ";
    }
    return str.slice(0, -3);
};

var getShortDescription = function (str) {
    return str.split('|')[0];
};

var countLogMessages = function (item) {
    if ((!item.logWarnings || !item.logErrors) && item.browserLogs && item.browserLogs.length > 0) {
        item.logWarnings = 0;
        item.logErrors = 0;
        for (var logNumber = 0; logNumber < item.browserLogs.length; logNumber++) {
            var logEntry = item.browserLogs[logNumber];
            if (logEntry.level === 'SEVERE') {
                item.logErrors++;
            }
            if (logEntry.level === 'WARNING') {
                item.logWarnings++;
            }
        }
    }
};

var convertTimestamp = function (timestamp) {
    var d = new Date(timestamp),
        yyyy = d.getFullYear(),
        mm = ('0' + (d.getMonth() + 1)).slice(-2),
        dd = ('0' + d.getDate()).slice(-2),
        hh = d.getHours(),
        h = hh,
        min = ('0' + d.getMinutes()).slice(-2),
        ampm = 'AM',
        time;

    if (hh > 12) {
        h = hh - 12;
        ampm = 'PM';
    } else if (hh === 12) {
        h = 12;
        ampm = 'PM';
    } else if (hh === 0) {
        h = 12;
    }

    // ie: 2013-02-18, 8:35 AM
    time = yyyy + '-' + mm + '-' + dd + ', ' + h + ':' + min + ' ' + ampm;

    return time;
};

var defaultSortFunction = function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) {
        return -1;
    } else if (a.sessionId > b.sessionId) {
        return 1;
    }

    if (a.timestamp < b.timestamp) {
        return -1;
    } else if (a.timestamp > b.timestamp) {
        return 1;
    }

    return 0;
};

//</editor-fold>

app.controller('ScreenshotReportController', ['$scope', '$http', 'TitleService', function ($scope, $http, titleService) {
    var that = this;
    var clientDefaults = {};

    $scope.searchSettings = Object.assign({
        description: '',
        allselected: true,
        passed: true,
        failed: true,
        pending: true,
        withLog: true
    }, clientDefaults.searchSettings || {}); // enable customisation of search settings on first page hit

    this.warningTime = 1400;
    this.dangerTime = 1900;
    this.totalDurationFormat = clientDefaults.totalDurationFormat;
    this.showTotalDurationIn = clientDefaults.showTotalDurationIn;

    var initialColumnSettings = clientDefaults.columnSettings; // enable customisation of visible columns on first page hit
    if (initialColumnSettings) {
        if (initialColumnSettings.displayTime !== undefined) {
            // initial settings have be inverted because the html bindings are inverted (e.g. !ctrl.displayTime)
            this.displayTime = !initialColumnSettings.displayTime;
        }
        if (initialColumnSettings.displayBrowser !== undefined) {
            this.displayBrowser = !initialColumnSettings.displayBrowser; // same as above
        }
        if (initialColumnSettings.displaySessionId !== undefined) {
            this.displaySessionId = !initialColumnSettings.displaySessionId; // same as above
        }
        if (initialColumnSettings.displayOS !== undefined) {
            this.displayOS = !initialColumnSettings.displayOS; // same as above
        }
        if (initialColumnSettings.inlineScreenshots !== undefined) {
            this.inlineScreenshots = initialColumnSettings.inlineScreenshots; // this setting does not have to be inverted
        } else {
            this.inlineScreenshots = false;
        }
        if (initialColumnSettings.warningTime) {
            this.warningTime = initialColumnSettings.warningTime;
        }
        if (initialColumnSettings.dangerTime) {
            this.dangerTime = initialColumnSettings.dangerTime;
        }
    }


    this.chooseAllTypes = function () {
        var value = true;
        $scope.searchSettings.allselected = !$scope.searchSettings.allselected;
        if (!$scope.searchSettings.allselected) {
            value = false;
        }

        $scope.searchSettings.passed = value;
        $scope.searchSettings.failed = value;
        $scope.searchSettings.pending = value;
        $scope.searchSettings.withLog = value;
    };

    this.isValueAnArray = function (val) {
        return isValueAnArray(val);
    };

    this.getParent = function (str) {
        return getParent(str);
    };

    this.getSpec = function (str) {
        return getSpec(str);
    };

    this.getShortDescription = function (str) {
        return getShortDescription(str);
    };
    this.hasNextScreenshot = function (index) {
        var old = index;
        return old !== this.getNextScreenshotIdx(index);
    };

    this.hasPreviousScreenshot = function (index) {
        var old = index;
        return old !== this.getPreviousScreenshotIdx(index);
    };
    this.getNextScreenshotIdx = function (index) {
        var next = index;
        var hit = false;
        while (next + 2 < this.results.length) {
            next++;
            if (this.results[next].screenShotFile && !this.results[next].pending) {
                hit = true;
                break;
            }
        }
        return hit ? next : index;
    };

    this.getPreviousScreenshotIdx = function (index) {
        var prev = index;
        var hit = false;
        while (prev > 0) {
            prev--;
            if (this.results[prev].screenShotFile && !this.results[prev].pending) {
                hit = true;
                break;
            }
        }
        return hit ? prev : index;
    };

    this.convertTimestamp = convertTimestamp;


    this.round = function (number, roundVal) {
        return (parseFloat(number) / 1000).toFixed(roundVal);
    };


    this.passCount = function () {
        var passCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.passed) {
                passCount++;
            }
        }
        return passCount;
    };


    this.pendingCount = function () {
        var pendingCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.pending) {
                pendingCount++;
            }
        }
        return pendingCount;
    };

    this.failCount = function () {
        var failCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (!result.passed && !result.pending) {
                failCount++;
            }
        }
        return failCount;
    };

    this.totalDuration = function () {
        var sum = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.duration) {
                sum += result.duration;
            }
        }
        return sum;
    };

    this.passPerc = function () {
        return (this.passCount() / this.totalCount()) * 100;
    };
    this.pendingPerc = function () {
        return (this.pendingCount() / this.totalCount()) * 100;
    };
    this.failPerc = function () {
        return (this.failCount() / this.totalCount()) * 100;
    };
    this.totalCount = function () {
        return this.passCount() + this.failCount() + this.pendingCount();
    };


    var results = [
    {
        "description": "User login to the application|One-to-One Maps Functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "4dfb5d3689a96a10b632de910cd0c413",
        "instanceId": 33288,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mgmtservices.dev.zapoj.com/userLocation - Failed to load resource: the server responded with a status of 403 (Forbidden)",
                "timestamp": 1600337185556,
                "type": ""
            }
        ],
        "screenShotFile": "images\\001a00f3-007b-00b5-0032-00a800820034.png",
        "timestamp": 1600337170017,
        "duration": 45372
    },
    {
        "description": "serach and user click|One-to-One Maps Functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "4dfb5d3689a96a10b632de910cd0c413",
        "instanceId": 33288,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://zapoj.dev.zapoj.com/mode-undefined.js 0:0 Uncaught SyntaxError: Unexpected token '<'",
                "timestamp": 1600337227966,
                "type": ""
            }
        ],
        "screenShotFile": "images\\008e00c3-0010-0084-0006-002a003100c4.png",
        "timestamp": 1600337215818,
        "duration": 24566
    },
    {
        "description": "Compare the weather rightpanel and maps right panel|One-to-One Maps Functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "4dfb5d3689a96a10b632de910cd0c413",
        "instanceId": 33288,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images\\0042000b-003b-0075-0057-003b00d2007d.png",
        "timestamp": 1600337240796,
        "duration": 42547
    },
    {
        "description": "Location and members route map|One-to-One Maps Functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "4dfb5d3689a96a10b632de910cd0c413",
        "instanceId": 33288,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images\\00290057-0096-0032-002c-006900920087.png",
        "timestamp": 1600337283750,
        "duration": 92011
    },
    {
        "description": "Members and Teams search|One-to-One Maps Functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "4dfb5d3689a96a10b632de910cd0c413",
        "instanceId": 33288,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images\\00e300a1-0043-0069-004e-009600900098.png",
        "timestamp": 1600337376172,
        "duration": 36850
    },
    {
        "description": "Location search|One-to-One Maps Functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "4dfb5d3689a96a10b632de910cd0c413",
        "instanceId": 33288,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images\\001600e6-0020-0003-00f9-002f00e5002c.png",
        "timestamp": 1600337413432,
        "duration": 18348
    },
    {
        "description": "User login to the application|Team Calender Functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "0de2c563ad871cbd243a35bfcf3aac1c",
        "instanceId": 29440,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mgmtservices.dev.zapoj.com/userLocation - Failed to load resource: the server responded with a status of 403 (Forbidden)",
                "timestamp": 1600339555727,
                "type": ""
            }
        ],
        "screenShotFile": "images\\006700a8-00d0-009b-0009-002a009f0063.png",
        "timestamp": 1600339541144,
        "duration": 43865
    },
    {
        "description": "Select Team|Team Calender Functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "0de2c563ad871cbd243a35bfcf3aac1c",
        "instanceId": 29440,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images\\006300da-008f-0061-00cc-00b4000500ed.png",
        "timestamp": 1600339585580,
        "duration": 6156
    },
    {
        "description": "User login to the application|Team Calender Functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "b390ced8d8a82bb005b3ef598035488a",
        "instanceId": 20280,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mgmtservices.dev.zapoj.com/userLocation - Failed to load resource: the server responded with a status of 403 (Forbidden)",
                "timestamp": 1600340124709,
                "type": ""
            }
        ],
        "screenShotFile": "images\\007600b3-0048-0071-003b-00a9002a00b1.png",
        "timestamp": 1600340111386,
        "duration": 40619
    },
    {
        "description": "Select Team|Team Calender Functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "b390ced8d8a82bb005b3ef598035488a",
        "instanceId": 20280,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images\\00580057-00e8-00df-009f-006900e600de.png",
        "timestamp": 1600340152467,
        "duration": 6153
    },
    {
        "description": "Calender functionlaity|Team Calender Functionality",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "b390ced8d8a82bb005b3ef598035488a",
        "instanceId": 20280,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //div[@class='fc-row fc-week fc-widget-content fc-rigid']//td[@class='fc-day fc-widget-content fc-thu fc-today'])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //div[@class='fc-row fc-week fc-widget-content fc-rigid']//td[@class='fc-day fc-widget-content fc-thu fc-today'])\n    at elementArrayFinder.getWebElements.then (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27)\n    at ManagedPromise.invokeCallback_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as click] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as click] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at Grouprightpanle.selectdateincalender (E:\\Zapoj Automation Scripts\\Complexe code\\Tc.js:789:137)\n    at UserContext.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Calender.js:19:15)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Calender functionlaity\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Calender.js:17:5)\n    at addSpecsToSuite (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Calender.js:5:1)\n    at Module._compile (internal/modules/cjs/loader.js:776:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:787:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://zapoj.dev.zapoj.com/mode-undefined.js 0:0 Uncaught SyntaxError: Unexpected token '<'",
                "timestamp": 1600340165077,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://o20190828092008798-publicfiles.s3.amazonaws.com/userProfilePics/padbollu?1594700112008 - Failed to load resource: the server responded with a status of 403 (Forbidden)",
                "timestamp": 1600340168837,
                "type": ""
            }
        ],
        "screenShotFile": "images\\0053009f-00ae-00b8-005c-00f1000900d0.png",
        "timestamp": 1600340159071,
        "duration": 47899
    },
    {
        "description": "User login to the application|Team Calender Functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "749e1959ada8891b44f38b1931d9da62",
        "instanceId": 32496,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://code.jquery.com/jquery-1.12.4.min.js - Failed to load resource: net::ERR_TIMED_OUT",
                "timestamp": 1600340598160,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js 5:36 Uncaught Error: Bootstrap's JavaScript requires jQuery",
                "timestamp": 1600340598163,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mgmtservices.dev.zapoj.com/userLocation - Failed to load resource: the server responded with a status of 403 (Forbidden)",
                "timestamp": 1600340603759,
                "type": ""
            }
        ],
        "screenShotFile": "images\\008b00ff-008c-00cc-001e-003f0078003b.png",
        "timestamp": 1600340565929,
        "duration": 66419
    },
    {
        "description": "Select Team|Team Calender Functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "749e1959ada8891b44f38b1931d9da62",
        "instanceId": 32496,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images\\007b009f-00a0-0085-002f-00310060009c.png",
        "timestamp": 1600340632784,
        "duration": 6132
    },
    {
        "description": "Calender functionlaity|Team Calender Functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "749e1959ada8891b44f38b1931d9da62",
        "instanceId": 32496,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://zapoj.dev.zapoj.com/mode-undefined.js 0:0 Uncaught SyntaxError: Unexpected token '<'",
                "timestamp": 1600340645384,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://o20190828092008798-publicfiles.s3.amazonaws.com/userProfilePics/padbollu?1594700112008 - Failed to load resource: the server responded with a status of 403 (Forbidden)",
                "timestamp": 1600340658442,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://o20190828092008798-publicfiles.s3.amazonaws.com/userProfilePics/padbollu?1594700112008 - Failed to load resource: the server responded with a status of 403 (Forbidden)",
                "timestamp": 1600340664653,
                "type": ""
            }
        ],
        "screenShotFile": "images\\00640059-00cf-0049-003f-001700330016.png",
        "timestamp": 1600340639373,
        "duration": 25265
    },
    {
        "description": "User login to the application|Team Calender Functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "bf3d9f7d5f4d83c66aa8b2b022520160",
        "instanceId": 6124,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mgmtservices.dev.zapoj.com/userLocation - Failed to load resource: the server responded with a status of 403 (Forbidden)",
                "timestamp": 1600342104306,
                "type": ""
            }
        ],
        "screenShotFile": "images\\00a70014-009b-0053-004c-006a004700bf.png",
        "timestamp": 1600342091337,
        "duration": 46347
    },
    {
        "description": "Select Team|Team Calender Functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "bf3d9f7d5f4d83c66aa8b2b022520160",
        "instanceId": 6124,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images\\0027002f-0013-004d-0048-00dd009c007c.png",
        "timestamp": 1600342138152,
        "duration": 6229
    },
    {
        "description": "Calender functionlaity|Team Calender Functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "bf3d9f7d5f4d83c66aa8b2b022520160",
        "instanceId": 6124,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://zapoj.dev.zapoj.com/mode-undefined.js 0:0 Uncaught SyntaxError: Unexpected token '<'",
                "timestamp": 1600342150831,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://o20190828092008798-publicfiles.s3.amazonaws.com/userProfilePics/padbollu?1594700112008 - Failed to load resource: the server responded with a status of 403 (Forbidden)",
                "timestamp": 1600342159736,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://o20190828092008798-publicfiles.s3.amazonaws.com/userProfilePics/padbollu?1594700112008 - Failed to load resource: the server responded with a status of 403 (Forbidden)",
                "timestamp": 1600342165937,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://o20190828092008798-publicfiles.s3.amazonaws.com/userProfilePics/padbollu?1594700112008 - Failed to load resource: the server responded with a status of 403 (Forbidden)",
                "timestamp": 1600342165937,
                "type": ""
            }
        ],
        "screenShotFile": "images\\00720026-0040-00f6-0064-002f00090090.png",
        "timestamp": 1600342144825,
        "duration": 21106
    },
    {
        "description": "Creating a meeting|Team Calender Functionality",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "bf3d9f7d5f4d83c66aa8b2b022520160",
        "instanceId": 6124,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": [
            "Failed: element not interactable\n  (Session info: chrome=85.0.4183.102)\nBuild info: version: '3.141.59', revision: 'e82be7d358', time: '2018-11-14T08:25:53'\nSystem info: host: 'VENKATASAIBABU', ip: '169.254.186.53', os.name: 'Windows 10', os.arch: 'amd64', os.version: '10.0', java.version: '1.8.0_231'\nDriver info: driver.version: unknown"
        ],
        "trace": [
            "WebDriverError: element not interactable\n  (Session info: chrome=85.0.4183.102)\nBuild info: version: '3.141.59', revision: 'e82be7d358', time: '2018-11-14T08:25:53'\nSystem info: host: 'VENKATASAIBABU', ip: '169.254.186.53', os.name: 'Windows 10', os.arch: 'amd64', os.version: '10.0', java.version: '1.8.0_231'\nDriver info: driver.version: unknown\n    at Object.checkLegacyResponse (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\error.js:546:15)\n    at parseHttpResponse (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\http.js:509:13)\n    at doSend.then.response (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom: Task: WebElement.sendKeys()\n    at thenableWebDriverProxy.schedule (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\webdriver.js:807:17)\n    at WebElement.schedule_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\webdriver.js:2010:25)\n    at WebElement.sendKeys (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\webdriver.js:2174:19)\n    at actionFn (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:89:44)\n    at Array.map (<anonymous>)\n    at actionResults.getWebElements.then (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:461:65)\n    at ManagedPromise.invokeCallback_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as sendKeys] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at Grouprightpanle.entercalendername (E:\\Zapoj Automation Scripts\\Complexe code\\Tc.js:794:35)\n    at UserContext.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Calender.js:22:15)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Creating a meeting\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Calender.js:21:5)\n    at addSpecsToSuite (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Calender.js:5:1)\n    at Module._compile (internal/modules/cjs/loader.js:776:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:787:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "images\\008a0047-003d-0050-00dc-009d006600f0.png",
        "timestamp": 1600342166298,
        "duration": 6099
    },
    {
        "description": "User login to the application|Team Calender Functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "9c1402d8a310ed0419d4bbd628a8ea3b",
        "instanceId": 35252,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mgmtservices.dev.zapoj.com/userLocation - Failed to load resource: the server responded with a status of 403 (Forbidden)",
                "timestamp": 1600342400826,
                "type": ""
            }
        ],
        "screenShotFile": "images\\00200068-00d7-0016-007e-004a00d7004d.png",
        "timestamp": 1600342385890,
        "duration": 44198
    },
    {
        "description": "Select Team|Team Calender Functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "9c1402d8a310ed0419d4bbd628a8ea3b",
        "instanceId": 35252,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images\\00330099-008f-0005-006b-00cf00af00e9.png",
        "timestamp": 1600342430542,
        "duration": 6207
    },
    {
        "description": "Calender functionlaity|Team Calender Functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "9c1402d8a310ed0419d4bbd628a8ea3b",
        "instanceId": 35252,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://zapoj.dev.zapoj.com/mode-undefined.js 0:0 Uncaught SyntaxError: Unexpected token '<'",
                "timestamp": 1600342443240,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://o20190828092008798-publicfiles.s3.amazonaws.com/userProfilePics/padbollu?1594700112008 - Failed to load resource: the server responded with a status of 403 (Forbidden)",
                "timestamp": 1600342452358,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://o20190828092008798-publicfiles.s3.amazonaws.com/userProfilePics/padbollu?1594700112008 - Failed to load resource: the server responded with a status of 403 (Forbidden)",
                "timestamp": 1600342458583,
                "type": ""
            }
        ],
        "screenShotFile": "images\\0007001f-0063-0041-00f4-004700b900de.png",
        "timestamp": 1600342437233,
        "duration": 21344
    },
    {
        "description": "Creating a meeting|Team Calender Functionality",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "9c1402d8a310ed0419d4bbd628a8ea3b",
        "instanceId": 35252,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": [
            "Failed: No element found using locator: By(css selector, .form-control.formInputs.focusNone.ng-touched.ng-dirty.ng-invalid#channelName)"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(css selector, .form-control.formInputs.focusNone.ng-touched.ng-dirty.ng-invalid#channelName)\n    at elementArrayFinder.getWebElements.then (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27)\n    at ManagedPromise.invokeCallback_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as sendKeys] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at Grouprightpanle.entercalendername (E:\\Zapoj Automation Scripts\\Complexe code\\Tc.js:794:100)\n    at UserContext.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Calender.js:22:15)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Creating a meeting\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Calender.js:21:5)\n    at addSpecsToSuite (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Calender.js:5:1)\n    at Module._compile (internal/modules/cjs/loader.js:776:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:787:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "images\\000d004c-002d-0043-00cc-007600be00c6.png",
        "timestamp": 1600342458932,
        "duration": 6032
    },
    {
        "description": "User login to the application|Team Calender Functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "9637a0a935845dc0039122144e8013f6",
        "instanceId": 33728,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mgmtservices.dev.zapoj.com/userLocation - Failed to load resource: the server responded with a status of 403 (Forbidden)",
                "timestamp": 1600346645317,
                "type": ""
            }
        ],
        "screenShotFile": "images\\00040020-0073-0006-00d9-004e00b300df.png",
        "timestamp": 1600346632348,
        "duration": 43947
    },
    {
        "description": "Select Team|Team Calender Functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "9637a0a935845dc0039122144e8013f6",
        "instanceId": 33728,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images\\00310030-005e-00ef-00e7-00a8007700bb.png",
        "timestamp": 1600346676743,
        "duration": 6202
    },
    {
        "description": "Calender functionlaity|Team Calender Functionality",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "9637a0a935845dc0039122144e8013f6",
        "instanceId": 33728,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": [
            "Failed: No element found using locator: By(css selector, .ng-touched.ng-dirty.ng-invalid.form-control.formInputs.focusNone.ng-touched.ng-dirty.ng-invalid#channelName)"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(css selector, .ng-touched.ng-dirty.ng-invalid.form-control.formInputs.focusNone.ng-touched.ng-dirty.ng-invalid#channelName)\n    at elementArrayFinder.getWebElements.then (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27)\n    at ManagedPromise.invokeCallback_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as sendKeys] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at Grouprightpanle.entercalendername (E:\\Zapoj Automation Scripts\\Complexe code\\Tc.js:795:131)\n    at UserContext.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Calender.js:20:15)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Calender functionlaity\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Calender.js:17:5)\n    at addSpecsToSuite (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Calender.js:5:1)\n    at Module._compile (internal/modules/cjs/loader.js:776:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:787:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://zapoj.dev.zapoj.com/mode-undefined.js 0:0 Uncaught SyntaxError: Unexpected token '<'",
                "timestamp": 1600346689423,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://o20190828092008798-publicfiles.s3.amazonaws.com/userProfilePics/padbollu?1594700112008 - Failed to load resource: the server responded with a status of 403 (Forbidden)",
                "timestamp": 1600346693666,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://o20190828092008798-publicfiles.s3.amazonaws.com/userProfilePics/padbollu?1594700112008 - Failed to load resource: the server responded with a status of 403 (Forbidden)",
                "timestamp": 1600346740752,
                "type": ""
            }
        ],
        "screenShotFile": "images\\009e0012-00cd-00dc-0027-00a0004c00b4.png",
        "timestamp": 1600346683397,
        "duration": 57371
    },
    {
        "description": "Creating a meeting|Team Calender Functionality",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "9637a0a935845dc0039122144e8013f6",
        "instanceId": 33728,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //span[@class='ng-star-inserted'])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //span[@class='ng-star-inserted'])\n    at elementArrayFinder.getWebElements.then (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27)\n    at ManagedPromise.invokeCallback_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as click] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as click] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at Grouprightpanle.createbutton (E:\\Zapoj Automation Scripts\\Complexe code\\Tc.js:811:58)\n    at UserContext.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Calender.js:26:15)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Creating a meeting\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Calender.js:22:5)\n    at addSpecsToSuite (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Calender.js:5:1)\n    at Module._compile (internal/modules/cjs/loader.js:776:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:787:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "images\\005d00d8-00a8-0079-0009-00ee004c0002.png",
        "timestamp": 1600346741167,
        "duration": 18578
    },
    {
        "description": "User login to the application|Team Calender Functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "c8b1d7985cab4d5fbcfc8ff7d0a9c9ec",
        "instanceId": 9632,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mgmtservices.dev.zapoj.com/userLocation - Failed to load resource: the server responded with a status of 403 (Forbidden)",
                "timestamp": 1600346898730,
                "type": ""
            }
        ],
        "screenShotFile": "images\\002e00f8-00fc-00dc-00a9-009000fe0032.png",
        "timestamp": 1600346882360,
        "duration": 43743
    },
    {
        "description": "Select Team|Team Calender Functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "c8b1d7985cab4d5fbcfc8ff7d0a9c9ec",
        "instanceId": 9632,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images\\00560000-0082-0075-0010-006c002500e0.png",
        "timestamp": 1600346926648,
        "duration": 6165
    },
    {
        "description": "Calender functionlaity|Team Calender Functionality",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "c8b1d7985cab4d5fbcfc8ff7d0a9c9ec",
        "instanceId": 9632,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": [
            "Failed: No element found using locator: By(css selector, .ng-touched.ng-dirty.ng-invalid.form-control.formInputs.focusNone.ng-touched.ng-dirty.ng-invalid#channelName)"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(css selector, .ng-touched.ng-dirty.ng-invalid.form-control.formInputs.focusNone.ng-touched.ng-dirty.ng-invalid#channelName)\n    at elementArrayFinder.getWebElements.then (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27)\n    at ManagedPromise.invokeCallback_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as sendKeys] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at Grouprightpanle.entercalendername (E:\\Zapoj Automation Scripts\\Complexe code\\Tc.js:795:131)\n    at UserContext.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Calender.js:20:15)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Calender functionlaity\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Calender.js:17:5)\n    at addSpecsToSuite (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Calender.js:5:1)\n    at Module._compile (internal/modules/cjs/loader.js:776:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:787:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://zapoj.dev.zapoj.com/mode-undefined.js 0:0 Uncaught SyntaxError: Unexpected token '<'",
                "timestamp": 1600346939286,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://o20190828092008798-publicfiles.s3.amazonaws.com/userProfilePics/padbollu?1594700112008 - Failed to load resource: the server responded with a status of 403 (Forbidden)",
                "timestamp": 1600346947288,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://o20190828092008798-publicfiles.s3.amazonaws.com/userProfilePics/padbollu?1594700112008 - Failed to load resource: the server responded with a status of 403 (Forbidden)",
                "timestamp": 1600346959483,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://o20190828092008798-publicfiles.s3.amazonaws.com/userProfilePics/padbollu?1594700112008 - Failed to load resource: the server responded with a status of 403 (Forbidden)",
                "timestamp": 1600346959483,
                "type": ""
            }
        ],
        "screenShotFile": "images\\003f00d0-00ce-0084-0048-007b00c50076.png",
        "timestamp": 1600346933280,
        "duration": 26224
    },
    {
        "description": "Creating a meeting|Team Calender Functionality",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "c8b1d7985cab4d5fbcfc8ff7d0a9c9ec",
        "instanceId": 9632,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //span[@class='ng-star-inserted'])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //span[@class='ng-star-inserted'])\n    at elementArrayFinder.getWebElements.then (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27)\n    at ManagedPromise.invokeCallback_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as click] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as click] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at Grouprightpanle.createbutton (E:\\Zapoj Automation Scripts\\Complexe code\\Tc.js:813:58)\n    at UserContext.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Calender.js:26:15)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Creating a meeting\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Calender.js:22:5)\n    at addSpecsToSuite (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Calender.js:5:1)\n    at Module._compile (internal/modules/cjs/loader.js:776:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:787:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "images\\007b00f5-00d3-00b5-00f6-0068003000b3.png",
        "timestamp": 1600346959929,
        "duration": 30588
    },
    {
        "description": "User login to the application|Team Calender Functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "4ee7d2302e43b6ebf25b99ce42e234b1",
        "instanceId": 32080,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mgmtservices.dev.zapoj.com/userLocation - Failed to load resource: the server responded with a status of 403 (Forbidden)",
                "timestamp": 1600347284571,
                "type": ""
            }
        ],
        "screenShotFile": "images\\00a90097-0035-0086-00bb-006b002b00e0.png",
        "timestamp": 1600347269209,
        "duration": 41932
    },
    {
        "description": "Select Team|Team Calender Functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "4ee7d2302e43b6ebf25b99ce42e234b1",
        "instanceId": 32080,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images\\003a0061-00dc-001c-007f-000d007500dd.png",
        "timestamp": 1600347311663,
        "duration": 6203
    },
    {
        "description": "Calender functionlaity|Team Calender Functionality",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "4ee7d2302e43b6ebf25b99ce42e234b1",
        "instanceId": 32080,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": [
            "Failed: No element found using locator: By(css selector, .ng-touched.ng-dirty.ng-invalid.form-control.formInputs.focusNone.ng-touched.ng-dirty.ng-invalid#channelName)"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(css selector, .ng-touched.ng-dirty.ng-invalid.form-control.formInputs.focusNone.ng-touched.ng-dirty.ng-invalid#channelName)\n    at elementArrayFinder.getWebElements.then (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27)\n    at ManagedPromise.invokeCallback_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as sendKeys] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at Grouprightpanle.entercalendername (E:\\Zapoj Automation Scripts\\Complexe code\\Tc.js:796:131)\n    at UserContext.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Calender.js:20:15)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Calender functionlaity\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Calender.js:17:5)\n    at addSpecsToSuite (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Calender.js:5:1)\n    at Module._compile (internal/modules/cjs/loader.js:776:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:787:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://zapoj.dev.zapoj.com/mode-undefined.js 0:0 Uncaught SyntaxError: Unexpected token '<'",
                "timestamp": 1600347324369,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://o20190828092008798-publicfiles.s3.amazonaws.com/userProfilePics/padbollu?1594700112008 - Failed to load resource: the server responded with a status of 403 (Forbidden)",
                "timestamp": 1600347332362,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://o20190828092008798-publicfiles.s3.amazonaws.com/userProfilePics/padbollu?1594700112008 - Failed to load resource: the server responded with a status of 403 (Forbidden)",
                "timestamp": 1600347350573,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://o20190828092008798-publicfiles.s3.amazonaws.com/userProfilePics/padbollu?1594700112008 - Failed to load resource: the server responded with a status of 403 (Forbidden)",
                "timestamp": 1600347350573,
                "type": ""
            }
        ],
        "screenShotFile": "images\\00f9006b-0032-0011-0077-008500f300f6.png",
        "timestamp": 1600347318325,
        "duration": 32272
    },
    {
        "description": "Creating a meeting|Team Calender Functionality",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "4ee7d2302e43b6ebf25b99ce42e234b1",
        "instanceId": 32080,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //span[@class='ng-star-inserted'])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //span[@class='ng-star-inserted'])\n    at elementArrayFinder.getWebElements.then (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27)\n    at ManagedPromise.invokeCallback_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as click] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as click] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at Grouprightpanle.createbutton (E:\\Zapoj Automation Scripts\\Complexe code\\Tc.js:814:58)\n    at UserContext.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Calender.js:26:15)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Creating a meeting\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Calender.js:22:5)\n    at addSpecsToSuite (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Calender.js:5:1)\n    at Module._compile (internal/modules/cjs/loader.js:776:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:787:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "images\\001e00f2-0089-0018-00a4-003d002e009f.png",
        "timestamp": 1600347350963,
        "duration": 30569
    },
    {
        "description": "User login to the application|One-to-One Maps Functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "8f182410ca45a6aece171facff83ed51",
        "instanceId": 5096,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mgmtservices.dev.zapoj.com/userLocation - Failed to load resource: the server responded with a status of 403 (Forbidden)",
                "timestamp": 1600401706954,
                "type": ""
            }
        ],
        "screenShotFile": "images\\00e100b3-006a-0060-002c-0092002e0092.png",
        "timestamp": 1600401643123,
        "duration": 108523
    },
    {
        "description": "serach and user click|One-to-One Maps Functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "8f182410ca45a6aece171facff83ed51",
        "instanceId": 5096,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images\\0088001b-00cb-0030-0021-004700840020.png",
        "timestamp": 1600401755722,
        "duration": 25582
    },
    {
        "description": "Compare the weather rightpanel and maps right panel|One-to-One Maps Functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "8f182410ca45a6aece171facff83ed51",
        "instanceId": 5096,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images\\00500022-00e8-00bb-00da-00c6000f00d5.png",
        "timestamp": 1600401781744,
        "duration": 42485
    },
    {
        "description": "Location and members route map|One-to-One Maps Functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "8f182410ca45a6aece171facff83ed51",
        "instanceId": 5096,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images\\003000cb-00f1-005c-0036-006400a000ae.png",
        "timestamp": 1600401824648,
        "duration": 91783
    },
    {
        "description": "Members and Teams search|One-to-One Maps Functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "8f182410ca45a6aece171facff83ed51",
        "instanceId": 5096,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images\\004200ab-00aa-00ee-0033-002500d4008a.png",
        "timestamp": 1600401916824,
        "duration": 36700
    },
    {
        "description": "Location search|One-to-One Maps Functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "8f182410ca45a6aece171facff83ed51",
        "instanceId": 5096,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images\\00dc00a3-00e5-002e-00fe-00c500290052.png",
        "timestamp": 1600401953989,
        "duration": 18333
    },
    {
        "description": "User login to the application|One-to-One Maps Functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "fce0f9f13dc0b719f7b1e9ae0712b895",
        "instanceId": 508,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mgmtservices.dev.zapoj.com/userLocation - Failed to load resource: the server responded with a status of 403 (Forbidden)",
                "timestamp": 1600428692113,
                "type": ""
            }
        ],
        "screenShotFile": "images\\004000b9-0042-002d-0007-006f00e30023.png",
        "timestamp": 1600428671297,
        "duration": 53076
    },
    {
        "description": "serach and user click|One-to-One Maps Functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "fce0f9f13dc0b719f7b1e9ae0712b895",
        "instanceId": 508,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://zapoj.dev.zapoj.com/mode-undefined.js 0:0 Uncaught SyntaxError: Unexpected token '<'",
                "timestamp": 1600428736965,
                "type": ""
            }
        ],
        "screenShotFile": "images\\00b20025-00ef-0007-0079-008a0040002e.png",
        "timestamp": 1600428724859,
        "duration": 25030
    },
    {
        "description": "Compare the weather rightpanel and maps right panel|One-to-One Maps Functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "fce0f9f13dc0b719f7b1e9ae0712b895",
        "instanceId": 508,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images\\00350088-0026-0081-00a5-00f3005900f5.png",
        "timestamp": 1600428750298,
        "duration": 42488
    },
    {
        "description": "Location and members route map|One-to-One Maps Functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "fce0f9f13dc0b719f7b1e9ae0712b895",
        "instanceId": 508,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images\\00fc00cb-00fa-00b6-003b-001000e200b7.png",
        "timestamp": 1600428793286,
        "duration": 91890
    },
    {
        "description": "Members and Teams search|One-to-One Maps Functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "fce0f9f13dc0b719f7b1e9ae0712b895",
        "instanceId": 508,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images\\00570057-006e-0084-002e-000700d70041.png",
        "timestamp": 1600428885616,
        "duration": 36789
    },
    {
        "description": "Location search|One-to-One Maps Functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "fce0f9f13dc0b719f7b1e9ae0712b895",
        "instanceId": 508,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.102"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images\\00030075-0067-00b8-006e-005700ae00be.png",
        "timestamp": 1600428922909,
        "duration": 18340
    },
    {
        "description": "User login to the application|One-to-One Maps Functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "adfac16975a24139d2f769e89f4b404f",
        "instanceId": 8072,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.121"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mgmtservices.dev.zapoj.com/userLocation - Failed to load resource: the server responded with a status of 403 (Forbidden)",
                "timestamp": 1601299331789,
                "type": ""
            }
        ],
        "screenShotFile": "images\\00470074-00c7-0084-0009-0001002600ef.png",
        "timestamp": 1601299317570,
        "duration": 40970
    },
    {
        "description": "serach and user click|One-to-One Maps Functionality",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "adfac16975a24139d2f769e89f4b404f",
        "instanceId": 8072,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.121"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //ul[@class='memberList list-unstyled member-only']/li[7]//span[@class='user-name unread-msg-user'])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //ul[@class='memberList list-unstyled member-only']/li[7]//span[@class='user-name unread-msg-user'])\n    at elementArrayFinder.getWebElements.then (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27)\n    at ManagedPromise.invokeCallback_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as click] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as click] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at Grouprightpanle.pickuserinleftpanel (E:\\Zapoj Automation Scripts\\Complexe code\\Tc.js:467:124)\n    at UserContext.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Maps.js:17:14)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"serach and user click\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Maps.js:14:5)\n    at addSpecsToSuite (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Maps.js:5:1)\n    at Module._compile (internal/modules/cjs/loader.js:776:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:787:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "images\\00320010-00db-0000-0028-009000930089.png",
        "timestamp": 1601299359284,
        "duration": 6076
    },
    {
        "description": "Compare the weather rightpanel and maps right panel|One-to-One Maps Functionality",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "adfac16975a24139d2f769e89f4b404f",
        "instanceId": 8072,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.121"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //div[@class='btn-group pull-left']//button//i[@class='fa fa-snowflake-o'])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //div[@class='btn-group pull-left']//button//i[@class='fa fa-snowflake-o'])\n    at elementArrayFinder.getWebElements.then (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27)\n    at ManagedPromise.invokeCallback_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as click] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as click] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at Grouprightpanle.clickonweatherinmaps (E:\\Zapoj Automation Scripts\\Complexe code\\Tc.js:696:99)\n    at UserContext.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Maps.js:24:15)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Compare the weather rightpanel and maps right panel\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Maps.js:20:5)\n    at addSpecsToSuite (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Maps.js:5:1)\n    at Module._compile (internal/modules/cjs/loader.js:776:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:787:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "images\\00b30042-0079-006d-006f-000700ab0047.png",
        "timestamp": 1601299365685,
        "duration": 6024
    },
    {
        "description": "Location and members route map|One-to-One Maps Functionality",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "adfac16975a24139d2f769e89f4b404f",
        "instanceId": 8072,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.121"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //div[@class='btn-group pull-left']//button//i[@class='fa fa-location-arrow'])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //div[@class='btn-group pull-left']//button//i[@class='fa fa-location-arrow'])\n    at elementArrayFinder.getWebElements.then (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27)\n    at ManagedPromise.invokeCallback_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as click] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as click] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at Grouprightpanle.clickonmenubardirection (E:\\Zapoj Automation Scripts\\Complexe code\\Tc.js:715:102)\n    at UserContext.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Maps.js:32:15)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Location and members route map\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Maps.js:31:5)\n    at addSpecsToSuite (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Maps.js:5:1)\n    at Module._compile (internal/modules/cjs/loader.js:776:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:787:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "images\\00f000bf-0098-0072-0017-006600ae0030.png",
        "timestamp": 1601299372085,
        "duration": 6031
    },
    {
        "description": "User login to the application|One-to-One Maps Functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "a50c8c2247f36af142a44db202db16bf",
        "instanceId": 11324,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.121"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mgmtservices.dev.zapoj.com/userLocation - Failed to load resource: the server responded with a status of 403 (Forbidden)",
                "timestamp": 1601299962060,
                "type": ""
            }
        ],
        "screenShotFile": "images\\000b0065-00c5-0010-009a-005f00e800c1.png",
        "timestamp": 1601299944943,
        "duration": 46978
    },
    {
        "description": "serach and user click|One-to-One Maps Functionality",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "a50c8c2247f36af142a44db202db16bf",
        "instanceId": 11324,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.121"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //ul[@class='memberList list-unstyled member-only']/li[7]//span[@class='user-name unread-msg-user'])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //ul[@class='memberList list-unstyled member-only']/li[7]//span[@class='user-name unread-msg-user'])\n    at elementArrayFinder.getWebElements.then (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27)\n    at ManagedPromise.invokeCallback_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as click] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as click] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at Grouprightpanle.pickuserinleftpanel (E:\\Zapoj Automation Scripts\\Complexe code\\Tc.js:467:124)\n    at UserContext.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Maps.js:17:14)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"serach and user click\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Maps.js:14:5)\n    at addSpecsToSuite (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Maps.js:5:1)\n    at Module._compile (internal/modules/cjs/loader.js:776:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:787:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "images\\00b10010-00b4-00d7-00b3-00d6002600b4.png",
        "timestamp": 1601299992405,
        "duration": 6030
    },
    {
        "description": "Compare the weather rightpanel and maps right panel|One-to-One Maps Functionality",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "a50c8c2247f36af142a44db202db16bf",
        "instanceId": 11324,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.121"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //div[@class='btn-group pull-left']//button//i[@class='fa fa-snowflake-o'])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //div[@class='btn-group pull-left']//button//i[@class='fa fa-snowflake-o'])\n    at elementArrayFinder.getWebElements.then (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27)\n    at ManagedPromise.invokeCallback_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as click] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as click] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at Grouprightpanle.clickonweatherinmaps (E:\\Zapoj Automation Scripts\\Complexe code\\Tc.js:696:99)\n    at UserContext.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Maps.js:24:15)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Compare the weather rightpanel and maps right panel\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Maps.js:20:5)\n    at addSpecsToSuite (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Maps.js:5:1)\n    at Module._compile (internal/modules/cjs/loader.js:776:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:787:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "images\\00cd008a-00d2-00a5-008f-00a700c7003a.png",
        "timestamp": 1601299998758,
        "duration": 6026
    },
    {
        "description": "Location and members route map|One-to-One Maps Functionality",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "a50c8c2247f36af142a44db202db16bf",
        "instanceId": 11324,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.121"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //div[@class='btn-group pull-left']//button//i[@class='fa fa-location-arrow'])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //div[@class='btn-group pull-left']//button//i[@class='fa fa-location-arrow'])\n    at elementArrayFinder.getWebElements.then (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27)\n    at ManagedPromise.invokeCallback_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as click] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as click] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at Grouprightpanle.clickonmenubardirection (E:\\Zapoj Automation Scripts\\Complexe code\\Tc.js:715:102)\n    at UserContext.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Maps.js:32:15)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Location and members route map\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Maps.js:31:5)\n    at addSpecsToSuite (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Maps.js:5:1)\n    at Module._compile (internal/modules/cjs/loader.js:776:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:787:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "images\\002d003f-002d-000c-0034-00bc004e00f7.png",
        "timestamp": 1601300005142,
        "duration": 6031
    },
    {
        "description": "Members and Teams search|One-to-One Maps Functionality",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "a50c8c2247f36af142a44db202db16bf",
        "instanceId": 11324,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.121"
        },
        "message": [
            "Failed: No element found using locator: By(css selector, button>i.fa.fa-users)"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(css selector, button>i.fa.fa-users)\n    at elementArrayFinder.getWebElements.then (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27)\n    at ManagedPromise.invokeCallback_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as click] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as click] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at Grouprightpanle.clickonmenubarmemberandteamsearch (E:\\Zapoj Automation Scripts\\Complexe code\\Tc.js:763:43)\n    at UserContext.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Maps.js:43:15)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Members and Teams search\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Maps.js:42:5)\n    at addSpecsToSuite (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Maps.js:5:1)\n    at Module._compile (internal/modules/cjs/loader.js:776:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:787:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "images\\00690035-007c-00a4-004e-00da00a400e3.png",
        "timestamp": 1601300011493,
        "duration": 6021
    },
    {
        "description": "Location search|One-to-One Maps Functionality",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "a50c8c2247f36af142a44db202db16bf",
        "instanceId": 11324,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.121"
        },
        "message": [
            "Failed: No element found using locator: By(css selector, button>i.fa.fa-map-marker)"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(css selector, button>i.fa.fa-map-marker)\n    at elementArrayFinder.getWebElements.then (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27)\n    at ManagedPromise.invokeCallback_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as click] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as click] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at Grouprightpanle.clickonmenubarlocationsearch (E:\\Zapoj Automation Scripts\\Complexe code\\Tc.js:776:48)\n    at UserContext.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Maps.js:49:15)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Location search\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Maps.js:48:5)\n    at addSpecsToSuite (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Maps.js:5:1)\n    at Module._compile (internal/modules/cjs/loader.js:776:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:787:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "images\\00a40001-00db-00b6-009a-00be0025000d.png",
        "timestamp": 1601300017873,
        "duration": 6024
    },
    {
        "description": "User login to the application|Public channel Right panel functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "943eb79c4f279056008ae5ebb46e5308",
        "instanceId": 14772,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.121"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mgmtservices.dev.zapoj.com/userLocation - Failed to load resource: the server responded with a status of 403 (Forbidden)",
                "timestamp": 1601300097095,
                "type": ""
            }
        ],
        "screenShotFile": "images\\00280048-00ff-0046-007a-000400ae0031.png",
        "timestamp": 1601300083884,
        "duration": 41249
    },
    {
        "description": "select the group|Public channel Right panel functionality",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "943eb79c4f279056008ae5ebb46e5308",
        "instanceId": 14772,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.121"
        },
        "message": [
            "Failed: No element found using locator: By(css selector, .custom-input)"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(css selector, .custom-input)\n    at elementArrayFinder.getWebElements.then (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27)\n    at ManagedPromise.invokeCallback_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as sendKeys] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at Grouprightpanle.searchbar (E:\\Zapoj Automation Scripts\\Complexe code\\Tc.js:116:47)\n    at UserContext.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Addtopic.js:30:11)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"select the group\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Addtopic.js:27:3)\n    at addSpecsToSuite (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Addtopic.js:6:1)\n    at Module._compile (internal/modules/cjs/loader.js:776:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:787:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://zapoj.dev.zapoj.com/mode-undefined.js 0:0 Uncaught SyntaxError: Unexpected token '<'",
                "timestamp": 1601300137703,
                "type": ""
            }
        ],
        "screenShotFile": "images\\00a40046-00de-00d8-00e4-00de00b800f4.png",
        "timestamp": 1601300125571,
        "duration": 24293
    },
    {
        "description": "Select the message for topic|Public channel Right panel functionality",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "943eb79c4f279056008ae5ebb46e5308",
        "instanceId": 14772,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.121"
        },
        "message": [
            "Failed: No element found using locator: by.cssContainingText(\".contentjustify\", \"india\")"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: by.cssContainingText(\".contentjustify\", \"india\")\n    at elementArrayFinder.getWebElements.then (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27)\n    at ManagedPromise.invokeCallback_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as click] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as click] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at Grouprightpanle.mousehover (E:\\Zapoj Automation Scripts\\Complexe code\\Tc.js:124:69)\n    at UserContext.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Addtopic.js:35:11)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Select the message for topic\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Addtopic.js:34:3)\n    at addSpecsToSuite (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Addtopic.js:6:1)\n    at Module._compile (internal/modules/cjs/loader.js:776:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:787:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "images\\004000f8-007b-0042-00c6-00d40029006a.png",
        "timestamp": 1601300150189,
        "duration": 18
    },
    {
        "description": "Create topic |Public channel Right panel functionality",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "943eb79c4f279056008ae5ebb46e5308",
        "instanceId": 14772,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.121"
        },
        "message": [
            "Failed: No element found using locator: By(css selector, #topicname)"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(css selector, #topicname)\n    at elementArrayFinder.getWebElements.then (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27)\n    at ManagedPromise.invokeCallback_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as sendKeys] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at Grouprightpanle.entertopicname (E:\\Zapoj Automation Scripts\\Complexe code\\Tc.js:588:33)\n    at UserContext.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Addtopic.js:41:11)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Create topic \") in control flow\n    at UserContext.<anonymous> (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Addtopic.js:40:3)\n    at addSpecsToSuite (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Addtopic.js:6:1)\n    at Module._compile (internal/modules/cjs/loader.js:776:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:787:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "images\\004d0031-00d4-00bd-0045-00b100990070.png",
        "timestamp": 1601300150560,
        "duration": 24
    },
    {
        "description": "Comapre the topic names form both sides|Public channel Right panel functionality",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "943eb79c4f279056008ae5ebb46e5308",
        "instanceId": 14772,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.121"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //a[.='Thistopic'])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //a[.='Thistopic'])\n    at elementArrayFinder.getWebElements.then (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27)\n    at ManagedPromise.invokeCallback_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as click] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as click] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at Grouprightpanle.opentopicbyclick (E:\\Zapoj Automation Scripts\\Complexe code\\Tc.js:606:43)\n    at UserContext.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Addtopic.js:51:13)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Comapre the topic names form both sides\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Addtopic.js:47:3)\n    at addSpecsToSuite (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Addtopic.js:6:1)\n    at Module._compile (internal/modules/cjs/loader.js:776:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:787:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "images\\003f00b3-00a2-00aa-00d9-00d8006e004a.png",
        "timestamp": 1601300150910,
        "duration": 6023
    },
    {
        "description": "List of topics|Public channel Right panel functionality",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "943eb79c4f279056008ae5ebb46e5308",
        "instanceId": 14772,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.121"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //ul[@class='nav nav-pills nav-stacked']//i[@class='fa fa-pencil'])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //ul[@class='nav nav-pills nav-stacked']//i[@class='fa fa-pencil'])\n    at elementArrayFinder.getWebElements.then (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27)\n    at ManagedPromise.invokeCallback_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as click] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as click] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at Grouprightpanle.listoftopicsclick (E:\\Zapoj Automation Scripts\\Complexe code\\Tc.js:647:91)\n    at UserContext.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Addtopic.js:121:11)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"List of topics\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Addtopic.js:120:3)\n    at addSpecsToSuite (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Addtopic.js:6:1)\n    at Module._compile (internal/modules/cjs/loader.js:776:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:787:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "images\\00b90060-00a7-00d8-001a-002200700046.png",
        "timestamp": 1601300157328,
        "duration": 6027
    },
    {
        "description": "User login to the application|Public channel Right panel functionality",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "00ca3c47f0dfa0b595ea764abcaffb5c",
        "instanceId": 14508,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.121"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mgmtservices.dev.zapoj.com/userLocation - Failed to load resource: the server responded with a status of 403 (Forbidden)",
                "timestamp": 1601300256987,
                "type": ""
            }
        ],
        "screenShotFile": "images\\006a002f-0080-0077-003b-001b0045001f.png",
        "timestamp": 1601300247893,
        "duration": 34276
    },
    {
        "description": "select the group|Public channel Right panel functionality",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "00ca3c47f0dfa0b595ea764abcaffb5c",
        "instanceId": 14508,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.121"
        },
        "message": [
            "Failed: No element found using locator: By(css selector, .custom-input)"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(css selector, .custom-input)\n    at elementArrayFinder.getWebElements.then (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27)\n    at ManagedPromise.invokeCallback_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as sendKeys] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at Grouprightpanle.searchbar (E:\\Zapoj Automation Scripts\\Complexe code\\Tc.js:116:47)\n    at UserContext.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Addtopic.js:30:11)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"select the group\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Addtopic.js:27:3)\n    at addSpecsToSuite (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Addtopic.js:6:1)\n    at Module._compile (internal/modules/cjs/loader.js:776:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:787:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://zapoj.dev.zapoj.com/mode-undefined.js 0:0 Uncaught SyntaxError: Unexpected token '<'",
                "timestamp": 1601300294724,
                "type": ""
            }
        ],
        "screenShotFile": "images\\00a800be-00aa-0007-004e-00d90008006a.png",
        "timestamp": 1601300282607,
        "duration": 24300
    },
    {
        "description": "Select the message for topic|Public channel Right panel functionality",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "00ca3c47f0dfa0b595ea764abcaffb5c",
        "instanceId": 14508,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.121"
        },
        "message": [
            "Failed: No element found using locator: by.cssContainingText(\".contentjustify\", \"india\")"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: by.cssContainingText(\".contentjustify\", \"india\")\n    at elementArrayFinder.getWebElements.then (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27)\n    at ManagedPromise.invokeCallback_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as click] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as click] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at Grouprightpanle.mousehover (E:\\Zapoj Automation Scripts\\Complexe code\\Tc.js:124:69)\n    at UserContext.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Addtopic.js:35:11)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Select the message for topic\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Addtopic.js:34:3)\n    at addSpecsToSuite (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Addtopic.js:6:1)\n    at Module._compile (internal/modules/cjs/loader.js:776:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:787:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "images\\000500ac-001f-0096-007b-006e00f60094.png",
        "timestamp": 1601300307406,
        "duration": 17
    },
    {
        "description": "Create topic |Public channel Right panel functionality",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "00ca3c47f0dfa0b595ea764abcaffb5c",
        "instanceId": 14508,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.121"
        },
        "message": [
            "Failed: No element found using locator: By(css selector, #topicname)"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(css selector, #topicname)\n    at elementArrayFinder.getWebElements.then (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27)\n    at ManagedPromise.invokeCallback_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as sendKeys] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at Grouprightpanle.entertopicname (E:\\Zapoj Automation Scripts\\Complexe code\\Tc.js:588:33)\n    at UserContext.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Addtopic.js:41:11)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Create topic \") in control flow\n    at UserContext.<anonymous> (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Addtopic.js:40:3)\n    at addSpecsToSuite (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Addtopic.js:6:1)\n    at Module._compile (internal/modules/cjs/loader.js:776:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:787:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "images\\00fb00e4-00e8-003a-0015-004500750025.png",
        "timestamp": 1601300307828,
        "duration": 26
    },
    {
        "description": "Comapre the topic names form both sides|Public channel Right panel functionality",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "00ca3c47f0dfa0b595ea764abcaffb5c",
        "instanceId": 14508,
        "browser": {
            "name": "chrome",
            "version": "85.0.4183.121"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //a[.='Thistopic'])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //a[.='Thistopic'])\n    at elementArrayFinder.getWebElements.then (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27)\n    at ManagedPromise.invokeCallback_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as click] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as click] (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at Grouprightpanle.opentopicbyclick (E:\\Zapoj Automation Scripts\\Complexe code\\Tc.js:606:43)\n    at UserContext.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Addtopic.js:51:13)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\nFrom: Task: Run it(\"Comapre the topic names form both sides\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Addtopic.js:47:3)\n    at addSpecsToSuite (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\venka\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (E:\\Zapoj Automation Scripts\\Actual code\\Addtopic.js:6:1)\n    at Module._compile (internal/modules/cjs/loader.js:776:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:787:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://o20190828092008798-publicfiles.s3.amazonaws.com/userProfilePics/padbollu?1594700112008 - Failed to load resource: the server responded with a status of 403 (Forbidden)",
                "timestamp": 1601300314180,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://zapoj.dev.zapoj.com/mode-undefined.js 0:0 Uncaught SyntaxError: Unexpected token '<'",
                "timestamp": 1601300314180,
                "type": ""
            }
        ],
        "screenShotFile": "images\\007b0081-0023-002d-0056-000500e60044.png",
        "timestamp": 1601300308171,
        "duration": 6026
    }
];

    this.sortSpecs = function () {
        this.results = results.sort(function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) return -1;else if (a.sessionId > b.sessionId) return 1;

    if (a.timestamp < b.timestamp) return -1;else if (a.timestamp > b.timestamp) return 1;

    return 0;
});

    };

    this.setTitle = function () {
        var title = $('.report-title').text();
        titleService.setTitle(title);
    };

    // is run after all test data has been prepared/loaded
    this.afterLoadingJobs = function () {
        this.sortSpecs();
        this.setTitle();
    };

    this.loadResultsViaAjax = function () {

        $http({
            url: './combined.json',
            method: 'GET'
        }).then(function (response) {
                var data = null;
                if (response && response.data) {
                    if (typeof response.data === 'object') {
                        data = response.data;
                    } else if (response.data[0] === '"') { //detect super escaped file (from circular json)
                        data = CircularJSON.parse(response.data); //the file is escaped in a weird way (with circular json)
                    } else {
                        data = JSON.parse(response.data);
                    }
                }
                if (data) {
                    results = data;
                    that.afterLoadingJobs();
                }
            },
            function (error) {
                console.error(error);
            });
    };


    if (clientDefaults.useAjax) {
        this.loadResultsViaAjax();
    } else {
        this.afterLoadingJobs();
    }

}]);

app.filter('bySearchSettings', function () {
    return function (items, searchSettings) {
        var filtered = [];
        if (!items) {
            return filtered; // to avoid crashing in where results might be empty
        }
        var prevItem = null;

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            item.displaySpecName = false;

            var isHit = false; //is set to true if any of the search criteria matched
            countLogMessages(item); // modifies item contents

            var hasLog = searchSettings.withLog && item.browserLogs && item.browserLogs.length > 0;
            if (searchSettings.description === '' ||
                (item.description && item.description.toLowerCase().indexOf(searchSettings.description.toLowerCase()) > -1)) {

                if (searchSettings.passed && item.passed || hasLog) {
                    isHit = true;
                } else if (searchSettings.failed && !item.passed && !item.pending || hasLog) {
                    isHit = true;
                } else if (searchSettings.pending && item.pending || hasLog) {
                    isHit = true;
                }
            }
            if (isHit) {
                checkIfShouldDisplaySpecName(prevItem, item);

                filtered.push(item);
                prevItem = item;
            }
        }

        return filtered;
    };
});

//formats millseconds to h m s
app.filter('timeFormat', function () {
    return function (tr, fmt) {
        if(tr == null){
            return "NaN";
        }

        switch (fmt) {
            case 'h':
                var h = tr / 1000 / 60 / 60;
                return "".concat(h.toFixed(2)).concat("h");
            case 'm':
                var m = tr / 1000 / 60;
                return "".concat(m.toFixed(2)).concat("min");
            case 's' :
                var s = tr / 1000;
                return "".concat(s.toFixed(2)).concat("s");
            case 'hm':
            case 'h:m':
                var hmMt = tr / 1000 / 60;
                var hmHr = Math.trunc(hmMt / 60);
                var hmMr = hmMt - (hmHr * 60);
                if (fmt === 'h:m') {
                    return "".concat(hmHr).concat(":").concat(hmMr < 10 ? "0" : "").concat(Math.round(hmMr));
                }
                return "".concat(hmHr).concat("h ").concat(hmMr.toFixed(2)).concat("min");
            case 'hms':
            case 'h:m:s':
                var hmsS = tr / 1000;
                var hmsHr = Math.trunc(hmsS / 60 / 60);
                var hmsM = hmsS / 60;
                var hmsMr = Math.trunc(hmsM - hmsHr * 60);
                var hmsSo = hmsS - (hmsHr * 60 * 60) - (hmsMr*60);
                if (fmt === 'h:m:s') {
                    return "".concat(hmsHr).concat(":").concat(hmsMr < 10 ? "0" : "").concat(hmsMr).concat(":").concat(hmsSo < 10 ? "0" : "").concat(Math.round(hmsSo));
                }
                return "".concat(hmsHr).concat("h ").concat(hmsMr).concat("min ").concat(hmsSo.toFixed(2)).concat("s");
            case 'ms':
                var msS = tr / 1000;
                var msMr = Math.trunc(msS / 60);
                var msMs = msS - (msMr * 60);
                return "".concat(msMr).concat("min ").concat(msMs.toFixed(2)).concat("s");
        }

        return tr;
    };
});


function PbrStackModalController($scope, $rootScope) {
    var ctrl = this;
    ctrl.rootScope = $rootScope;
    ctrl.getParent = getParent;
    ctrl.getShortDescription = getShortDescription;
    ctrl.convertTimestamp = convertTimestamp;
    ctrl.isValueAnArray = isValueAnArray;
    ctrl.toggleSmartStackTraceHighlight = function () {
        var inv = !ctrl.rootScope.showSmartStackTraceHighlight;
        ctrl.rootScope.showSmartStackTraceHighlight = inv;
    };
    ctrl.applySmartHighlight = function (line) {
        if ($rootScope.showSmartStackTraceHighlight) {
            if (line.indexOf('node_modules') > -1) {
                return 'greyout';
            }
            if (line.indexOf('  at ') === -1) {
                return '';
            }

            return 'highlight';
        }
        return '';
    };
}


app.component('pbrStackModal', {
    templateUrl: "pbr-stack-modal.html",
    bindings: {
        index: '=',
        data: '='
    },
    controller: PbrStackModalController
});

function PbrScreenshotModalController($scope, $rootScope) {
    var ctrl = this;
    ctrl.rootScope = $rootScope;
    ctrl.getParent = getParent;
    ctrl.getShortDescription = getShortDescription;

    /**
     * Updates which modal is selected.
     */
    this.updateSelectedModal = function (event, index) {
        var key = event.key; //try to use non-deprecated key first https://developer.mozilla.org/de/docs/Web/API/KeyboardEvent/keyCode
        if (key == null) {
            var keyMap = {
                37: 'ArrowLeft',
                39: 'ArrowRight'
            };
            key = keyMap[event.keyCode]; //fallback to keycode
        }
        if (key === "ArrowLeft" && this.hasPrevious) {
            this.showHideModal(index, this.previous);
        } else if (key === "ArrowRight" && this.hasNext) {
            this.showHideModal(index, this.next);
        }
    };

    /**
     * Hides the modal with the #oldIndex and shows the modal with the #newIndex.
     */
    this.showHideModal = function (oldIndex, newIndex) {
        const modalName = '#imageModal';
        $(modalName + oldIndex).modal("hide");
        $(modalName + newIndex).modal("show");
    };

}

app.component('pbrScreenshotModal', {
    templateUrl: "pbr-screenshot-modal.html",
    bindings: {
        index: '=',
        data: '=',
        next: '=',
        previous: '=',
        hasNext: '=',
        hasPrevious: '='
    },
    controller: PbrScreenshotModalController
});

app.factory('TitleService', ['$document', function ($document) {
    return {
        setTitle: function (title) {
            $document[0].title = title;
        }
    };
}]);


app.run(
    function ($rootScope, $templateCache) {
        //make sure this option is on by default
        $rootScope.showSmartStackTraceHighlight = true;
        
  $templateCache.put('pbr-screenshot-modal.html',
    '<div class="modal" id="imageModal{{$ctrl.index}}" tabindex="-1" role="dialog"\n' +
    '     aria-labelledby="imageModalLabel{{$ctrl.index}}" ng-keydown="$ctrl.updateSelectedModal($event,$ctrl.index)">\n' +
    '    <div class="modal-dialog modal-lg m-screenhot-modal" role="document">\n' +
    '        <div class="modal-content">\n' +
    '            <div class="modal-header">\n' +
    '                <button type="button" class="close" data-dismiss="modal" aria-label="Close">\n' +
    '                    <span aria-hidden="true">&times;</span>\n' +
    '                </button>\n' +
    '                <h6 class="modal-title" id="imageModalLabelP{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getParent($ctrl.data.description)}}</h6>\n' +
    '                <h5 class="modal-title" id="imageModalLabel{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getShortDescription($ctrl.data.description)}}</h5>\n' +
    '            </div>\n' +
    '            <div class="modal-body">\n' +
    '                <img class="screenshotImage" ng-src="{{$ctrl.data.screenShotFile}}">\n' +
    '            </div>\n' +
    '            <div class="modal-footer">\n' +
    '                <div class="pull-left">\n' +
    '                    <button ng-disabled="!$ctrl.hasPrevious" class="btn btn-default btn-previous" data-dismiss="modal"\n' +
    '                            data-toggle="modal" data-target="#imageModal{{$ctrl.previous}}">\n' +
    '                        Prev\n' +
    '                    </button>\n' +
    '                    <button ng-disabled="!$ctrl.hasNext" class="btn btn-default btn-next"\n' +
    '                            data-dismiss="modal" data-toggle="modal"\n' +
    '                            data-target="#imageModal{{$ctrl.next}}">\n' +
    '                        Next\n' +
    '                    </button>\n' +
    '                </div>\n' +
    '                <a class="btn btn-primary" href="{{$ctrl.data.screenShotFile}}" target="_blank">\n' +
    '                    Open Image in New Tab\n' +
    '                    <span class="glyphicon glyphicon-new-window" aria-hidden="true"></span>\n' +
    '                </a>\n' +
    '                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '</div>\n' +
     ''
  );

  $templateCache.put('pbr-stack-modal.html',
    '<div class="modal" id="modal{{$ctrl.index}}" tabindex="-1" role="dialog"\n' +
    '     aria-labelledby="stackModalLabel{{$ctrl.index}}">\n' +
    '    <div class="modal-dialog modal-lg m-stack-modal" role="document">\n' +
    '        <div class="modal-content">\n' +
    '            <div class="modal-header">\n' +
    '                <button type="button" class="close" data-dismiss="modal" aria-label="Close">\n' +
    '                    <span aria-hidden="true">&times;</span>\n' +
    '                </button>\n' +
    '                <h6 class="modal-title" id="stackModalLabelP{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getParent($ctrl.data.description)}}</h6>\n' +
    '                <h5 class="modal-title" id="stackModalLabel{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getShortDescription($ctrl.data.description)}}</h5>\n' +
    '            </div>\n' +
    '            <div class="modal-body">\n' +
    '                <div ng-if="$ctrl.data.trace.length > 0">\n' +
    '                    <div ng-if="$ctrl.isValueAnArray($ctrl.data.trace)">\n' +
    '                        <pre class="logContainer" ng-repeat="trace in $ctrl.data.trace track by $index"><div ng-class="$ctrl.applySmartHighlight(line)" ng-repeat="line in trace.split(\'\\n\') track by $index">{{line}}</div></pre>\n' +
    '                    </div>\n' +
    '                    <div ng-if="!$ctrl.isValueAnArray($ctrl.data.trace)">\n' +
    '                        <pre class="logContainer"><div ng-class="$ctrl.applySmartHighlight(line)" ng-repeat="line in $ctrl.data.trace.split(\'\\n\') track by $index">{{line}}</div></pre>\n' +
    '                    </div>\n' +
    '                </div>\n' +
    '                <div ng-if="$ctrl.data.browserLogs.length > 0">\n' +
    '                    <h5 class="modal-title">\n' +
    '                        Browser logs:\n' +
    '                    </h5>\n' +
    '                    <pre class="logContainer"><div class="browserLogItem"\n' +
    '                                                   ng-repeat="logError in $ctrl.data.browserLogs track by $index"><div><span class="label browserLogLabel label-default"\n' +
    '                                                                                                                             ng-class="{\'label-danger\': logError.level===\'SEVERE\', \'label-warning\': logError.level===\'WARNING\'}">{{logError.level}}</span><span class="label label-default">{{$ctrl.convertTimestamp(logError.timestamp)}}</span><div ng-repeat="messageLine in logError.message.split(\'\\\\n\') track by $index">{{ messageLine }}</div></div></div></pre>\n' +
    '                </div>\n' +
    '            </div>\n' +
    '            <div class="modal-footer">\n' +
    '                <button class="btn btn-default"\n' +
    '                        ng-class="{active: $ctrl.rootScope.showSmartStackTraceHighlight}"\n' +
    '                        ng-click="$ctrl.toggleSmartStackTraceHighlight()">\n' +
    '                    <span class="glyphicon glyphicon-education black"></span> Smart Stack Trace\n' +
    '                </button>\n' +
    '                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '</div>\n' +
     ''
  );

    });

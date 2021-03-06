(function(window, document, version, callback) {
    var j, d;
    var loaded = false;
    if (!(j = window.jQuery) || version > j.fn.jquery || callback(j)) {
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.src = DEBUG_TOOLBAR_MEDIA_URL + "js/jquery.js";
        script.onload = script.onreadystatechange = function() {
            if (!loaded && (!(d = this.readyState) || d == "loaded" || d == "complete")) {
                callback((j = window.jQuery).noConflict(1), loaded = true);
                j(script).remove();
            }
        };
        document.documentElement.childNodes[0].appendChild(script)
    }
})(window, document, "1.3", function($, jquery_loaded) {

    $.cookie = function(name, value, options) { if (typeof value != 'undefined') { options = options || {}; if (value === null) { value = ''; options.expires = -1; } var expires = ''; if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) { var date; if (typeof options.expires == 'number') { date = new Date(); date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000)); } else { date = options.expires; } expires = '; expires=' + date.toUTCString(); } var path = options.path ? '; path=' + (options.path) : ''; var domain = options.domain ? '; domain=' + (options.domain) : ''; var secure = options.secure ? '; secure' : ''; document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join(''); } else { var cookieValue = null; if (document.cookie && document.cookie != '') { var cookies = document.cookie.split(';'); for (var i = 0; i < cookies.length; i++) { var cookie = $.trim(cookies[i]); if (cookie.substring(0, name.length + 1) == (name + '=')) { cookieValue = decodeURIComponent(cookie.substring(name.length + 1)); break; } } } return cookieValue; } };
    $('head').append('<link rel="stylesheet" href="'+DEBUG_TOOLBAR_MEDIA_URL+'css/toolbar.css" type="text/css" />');
    var COOKIE_NAME = 'djdt';
    var djdt = {
        popup: null,
        inspector:false,
        initRemoteCallEvent: function(context) {
            var self = this;
            context = context || '#djDebug';

            $('a.remoteCall', context).click(function() {
                var popup = $('<div class="djDebugWindow panelContent"></div>').appendTo(context).show();
                popup.html('<div class="loader"></div>');
                popup.load(this.href, {}, function() {
                    $('a.djDebugBack', popup).click(function() {
                        popup.hide();
                        popup.remove();
                        return false;
                    });
                    self.initRemoteCallEvent(popup);
                });
                popup.show();
                return false;
            });

            self.initAutoselectedTexts();
        },
        initUtilsForm: function(){
            var self = this;
            $('#djDebug').find('#class-search-form').submit(function(){
                $.ajax({
                    type: "POST",
                    url: this.action,
                    dataType: "html",
                    data: $(this).serializeArray(),
                    success: function(data){
                        var results = $('#class-search-results');
                        results.html(data);
                        self.initRemoteCallEvent(results);
                    }
                });
                return false;
            });
        },
        initAutoselectedTexts: function(context){
            var self = this;
            context = context || '#djDebug';
            $('.autoselect', context).dblclick(function(){
                self.select(this);
            });
        },
        select: function(target) {
            var rng, sel;
            if ( document.createRange ) {
                rng = document.createRange();
                rng.selectNode( target )
                sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange( rng );
            } else {
                var rng = document.body.createTextRange();
                rng.moveToElementText( target );
                rng.select();
            }
        },
        init: function(context) {
            $('#djDebug').show();
            var current = null;
            $('#djDebugPanelList li a').click(function() {
                if (!this.className) {
                    return false;
                }
                current = $('#djDebug #' + this.className);
                if (current.is(':visible')) {
                    $(document).trigger('close.djDebug');
                    $(this).parent().removeClass('active');
                } else {
                    $('.panelContent').hide(); // Hide any that are already open
                    current.show();
                    $('#djDebugToolbar li').removeClass('active');
                    $(this).parent().addClass('active');
                }
                return false;
            });
            $('#djDebug a.djDebugClose').click(function() {
                $(document).trigger('close.djDebug');
                $('#djDebugToolbar li').removeClass('active');
                return false;
            });

            this.initRemoteCallEvent();
            this.initUtilsForm();

            $('#debug-panel-Layout a.djTemplateShowContext').click(function() {
                djdt.toggle_arrow($(this).children('.toggleArrow'))
                djdt.toggle_content($(this).parent().next());
                return false;
            });
            $('#djDebugSQLPanel a.djSQLShowStacktrace').click(function() {
                djdt.toggle_content($('.djSQLHideStacktraceDiv', $(this).parents('tr')));
                return false;
            });
            $('#djHideToolBarButton').click(function() {
                djdt.hide_toolbar(true);
                return false;
            });
            $('#djShowToolBarButton').click(function() {
                djdt.show_toolbar();
                return false;
            });
            $(document).bind('close.djDebug', function() {
                // If a sub-panel is open, close that
                if ($('.djDebugWindow').is(':visible')) {
                    $('.djDebugWindow').hide().remove();
                    return;
                }
                // If a panel is open, close that
                if ($('.panelContent').is(':visible')) {
                    $('.panelContent').hide();
                    return;
                }
                // Otherwise, just minimize the toolbar
                if ($('#djDebugToolbar').is(':visible')) {
                    djdt.hide_toolbar(true);
                    return;
                }
            });
            if ($.cookie(COOKIE_NAME)) {
                djdt.hide_toolbar(false);
            } else {
                djdt.show_toolbar(false);
            }
            this.initInspector(document);
        },
        toggle_content: function(elem) {
            if (elem.is(':visible')) {
                elem.hide();
            } else {
                elem.show();
            }
        },
        close: function() {
            $(document).trigger('close.djDebug');
            return false;
        },
        hide_toolbar: function(setCookie) {
            // close any sub panels
            $('.djDebugWindow').hide().remove();
            // close all panels
            $('.panelContent').hide();
            $('#djDebugToolbar li').removeClass('active');
            // finally close toolbar
            $('#djDebugToolbar').hide('fast');
            $('#djDebugToolbarHandle').show();
            // Unbind keydown
            $(document).unbind('keydown.djDebug');
            if (setCookie) {
                $.cookie(COOKIE_NAME, 'hide', {
                    path: '/',
                    expires: 10
                });
            }
        },
        show_toolbar: function(animate) {
            // Set up keybindings
            $(document).bind('keydown.djDebug', function(e) {
                if (e.keyCode == 27) {
                    djdt.close();
                }
            });
            $('#djDebugToolbarHandle').hide();
            if (animate) {
                $('#djDebugToolbar').show('fast');
            } else {
                $('#djDebugToolbar').show();
            }
            $.cookie(COOKIE_NAME, null, {
                path: '/',
                expires: -1
            });
        },
        toggle_arrow: function(elem) {
            var uarr = String.fromCharCode(0x25b6);
            var darr = String.fromCharCode(0x25bc);
            elem.html(elem.html() == uarr ? darr : uarr);
        },
        showPopup: function(elements,e) {
            var self = this;
            this.hidePopup();

            this.popup = $('<div class="djDebugToolbarPopup"><a href="javascript:;" class="btn-close">&nbsp;</a></div>').appendTo('body');

            var table = $('<table></table>').appendTo(this.popup);
            var j = 0;
            $(elements).each(function() {
                var block = $(this);
                var data = $(this).attr('data-debug');
                if (!$.isNumeric(data)) {
                    data = [eval('(' + data + ')')];
                } else {
                    data = $(this).data('debug');
                }

                for (var i = 0; i< data.length; i++) {
                    var d = data[i];

                    if (j) {
                        table.append('<tr><td colspan="2"> &darr; </td></tr>');
                    }
                    var a = $('<a class="highlightBtn">highlight</a>');
                    a.hover(function(){
                        block.addClass('djDebugHover');
                        self.popup.addClass('invisible');
                    }, function(){
                        block.removeClass('djDebugHover');
                        self.popup.removeClass('invisible');
                    });

                    var tr = $('<tr></tr>')
                    var td = $('<td></td>').append(a).appendTo(tr);
                    table.append(tr);
                    for (var k in d) {
                      table.append('<tr><td>'+ k +'</td><td><span>'+ d[k] +'</span></td></tr>');
                    }
                    j++;
                }
            });

            /*var offset = $(elements.get(0)).offset();
            $(this.popup).css({
                'left' : offset.left + 'px',
                'top' : offset.top + 'px'
            }).show();*/

            $(this.popup).on('dblclick', 'td span', function(e) {
                self.select(this);
            })
            $(this.popup).on('click', 'a.btn-close', function(e) {
                self.hidePopup(e);
            })
            self.position($(this.popup), e).show();
        },
        hidePopup: function(e){
             if (this.popup != null) {
                 $(this.popup).hide().remove();
                 this.popup = null;
             }
             $('.djDebugHover').removeClass('djDebugHover');
        },
        eachChildren: function(element, callback) {
            $(element).each(function(){
                var script = $(this);
                var endpointSelector = 'script[data-type="djDebug-end"][data-id="'+ script.attr('data-id') +'"]';
                script.nextUntil(endpointSelector).each(function(){
                    $.proxy(callback, this, script).call();
                });
                $(endpointSelector).remove();
                script.remove();
            });
        },
        setBlockHovers: function(element) {
            var self = this;
            var startSelector = 'script[data-type="djDebug-start"]';
            var endSelector = 'script[data-type="djDebug-end"]';

            this.eachChildren($(element).find(startSelector), function(script){
                var element = $(this);

                if (element.is('script,link,meta')) {
                    return;
                }

                self.addHover(element, script);
            });


        },
        addHover: function(element, script) {
            var data = script.attr('data-debug');
            element = $(element);

            if (typeof data == 'string') {
                data = eval('(' + data + ')');
            }

            var existingData = element.data('debug');
            if (existingData) {
                existingData.push(data);
            } else {
                existingData = [data];
            }

            element.attr('data-debug',script.attr('data-id'));
            element.data('debug', existingData);
        },
        activateInspector: function() {
            $(window).bind('click', this.showInspector);
            this.inspector = true;
            $('#djDebugInspectButton').addClass('active');
        },
        deactivateInspector: function() {
            $(window).unbind('click', this.showInspector);
            this.inspector = false;
            $('#djDebugInspectButton').removeClass('active');
        },
        initInspector: function(element) {
            var self = this;
            this.setBlockHovers(element);

            this.showInspector = $.proxy(this.showInspector, this);

            $('#djDebugInspectButton').click(function(e){
                e.stopPropagation();
                if (self.inspector == false) {
                    self.activateInspector();
                } else {
                    self.deactivateInspector();
                }
                return false;
            });
        },
        showInspector: function(e) {
            if ($(e.target) == $('#djDebugInspectButton')) {
                return true;
            }

            var self = this;
            self.hidePopup(e);
            var parents = $(e.target).parents('[data-debug]');
            if (parents.length > 0) {
                self.showPopup(parents,e);
            }

            self.deactivateInspector();
            e.stopPropagation();
            return false;
        },
        highLighBlock: function(element){
            this.unhighLighBlock();
            $(element).addClass('djDebugHover-selected');
        },
        unhighLighBlock: function(){
            $('.djDebugHover-selected').removeClass('djDebugHover-selected');
        },
        position: function(element, e){
            element.css("position","absolute");
            /*element.css("top", Math.max(0, (($(window).height() - $(element).outerHeight()) / 2) +
                                                            $(window).scrollTop()) + "px");
            element.css("left", Math.max(0, (($(window).width() - $(element).outerWidth()) / 2) +
                                                            $(window).scrollLeft()) + "px");*/

            var top = (e.pageY - $(element).outerHeight() / 2);
            if (top<=0) {
                top = 20;
            }

            var left = (e.pageX - $(element).outerWidth() / 2);
            if (left<=0) {
                left = 20;
            }
            element.css("top", top + "px");
            element.css("left", left + "px");
            return element;
        }

    };
    $(document).ready(function() {
        djdt.init();
    });
});


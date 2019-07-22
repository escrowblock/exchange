import { _ } from 'meteor/underscore';
import { Template } from 'meteor/templating';

Template.Trade.onDestroyed(function() {
    if (!_.isUndefined(this.tracker)) {
        this.tracker.stop();
    }
    if (!_.isUndefined(this.subsDepthData)) {
        this.subsDepthData.stop();
    }
    if (!_.isUndefined(this.subsChartData)) {
        this.subsChartData.stop();
    }
    if (!_.isUndefined(this.subsBookStatBuy)) {
        this.subsBookStatBuy.stop();
    }
    if (!_.isUndefined(this.subsBookStatSell)) {
        this.subsBookStatSell.stop();
    }
    if (!_.isUndefined(this.subsRecentTrades)) {
        this.subsRecentTrades.stop();
    }
    if (!_.isUndefined(this.subsMyOrders)) {
        this.subsMyOrders.stop();
    }
    if (!_.isUndefined(this.subsMyTrades)) {
        this.subsMyTrades.stop();
    }
    if (!_.isUndefined(this.subsPriceAverage)) {
        this.subsPriceAverage.stop();
    }
    if (!_.isUndefined(this.subsPriceLatest)) {
        this.subsPriceLatest.stop();
    }
});

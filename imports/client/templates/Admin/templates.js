import { Router } from 'meteor/iron:router';
import { _ } from 'meteor/underscore';
import { AdminCollectionsCount } from '/imports/collections';
import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import { Session } from 'meteor/session';

Template.AdminDashboardViewWrapper.onRendered(function() {
    const node = this.firstNode;
    return this.autorun(function() {
        const data = Template.currentData();
        if (data.view) {
            Blaze.remove(data.view);
        }
        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }
        data.view = Blaze.renderWithData(Template.AdminDashboardView, data, node);
        return data.view;
    });
});

Template.AdminDashboardViewWrapper.onDestroyed(function() {
    return Blaze.remove(this.data.view);
});

Template.AdminDashboardView.onRendered(function() {
    const table = this.$('.dataTable').DataTable();
    const filter = this.$('.dataTables_filter');
    const length = this.$('.dataTables_length');
    filter.html('<div class="ui icon input"><input type="text" placeholder="Search..."><i class="inverted circular search link icon"></i></div>');
    length.html('<select class="ui dropdown"> <option value="10">10</option> <option value="25">25</option> <option value="50">50</option> <option value="100">100</option> </select>');
    filter.find('input').on('keyup', function() {
        return table.search(this.value).draw();
    });
    return length.find('select').on('change', function() {
        return table.page.len(parseInt(this.value, 10)).draw();
    });
});

Template.AdminDashboardView.helpers({
    hasDocuments() {
        const count = AdminCollectionsCount.findOne({
            collection: Session.get('admin_collection_name'),
        });
        if (count != null) {
            return count.count > 0;
        }
        return true;
    },
    newPath() {
        return Router.path(`adminDashboard${Session.get('admin_collection_name')}New`);
    },
});

Template.adminEditBtn.helpers({
    path() {
        return Router.path(`adminDashboard${Session.get('admin_collection_name')}Edit`, {
            _id: this._id,
        });
    },
});

Template.AdminDashboard.helpers({
    isDefined(obj) {
        return obj != null;
    },
});

Template.AdminSidebar.helpers({
    showNewItemInSideBar() {
        return _.isUndefined(this.showNewInSideBar) ? true : this.showNewInSideBar;
    },
});

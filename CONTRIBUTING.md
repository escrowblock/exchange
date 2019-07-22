# Contributing to ESCB exchange

We are excited to have your help building ESCB exchange &mdash; both the platform and the community behind it. Please read the project overview and guidelines for contributing bug reports and new code, or it might be hard for the community to help you with your issue or pull request.

## Project overview

Before we jump into detailed guidelines for opening and triaging issues and submitting pull requests, here is some information about how our project is structured and resources you should refer to as you start contributing.

### Ways to contribute

There are many ways to contribute to the ESCB exchange Project. Here’s a list of technical contributions with increasing levels of involvement and required knowledge of ESCB exchange’s code and operations.  
- [Reporting a bug](CONTRIBUTING.md#reporting-a-bug-in-escb-exchange)
- [Triaging issues](ISSUE_TRIAGE.md)
- [Contributing to documentation](CONTRIBUTING.md#documentation)
- [Finding work](CONTRIBUTING.md#finding-work)
- [Submitting pull requests](CONTRIBUTING.md#making-changes-to-escb-exchange-core)
- [Reviewing pull requests](CONTRIBUTING.md#reviewer)
- [Maintaining a community package](CONTRIBUTING.md#community-package-maintainer)


### Finding work

We curate specific issues that would make great pull requests for community contributors by applying the `pull-requests-encouraged` label ([bugs](https://github.com/escrowblock/exchange/issues?q=is%3Aopen+is%3Aissue+label%3Apull-requests-encouraged) / [feature requests](https://github.com/escrowblock/escb-exchange-feature-requests/issues?q=is%3Aopen+is%3Aissue+label%3Apull-requests-encouraged)).

Issues which *also* have the `confirmed` label ([bugs](https://github.com/escrowblock/exchange/issues?q=is%3Aissue%20is%3Aopen%20label%3Apull-requests-encouraged%20label%3Aconfirmed) / [feature requests](https://github.com/escrowblock/escb-exchange-feature-requests/issues?q=is%3Aissue%20is%3Aopen%20label%3Apull-requests-encouraged%20label%3Aconfirmed)) are considered to have their details clear enough to begin working on.

Any issue which does not have the `confirmed` label still requires discussion on implementation details but input and positive commentary is welcome!  Any pull request opened on an issue which is not `confirmed` is still welcome, however the pull-request is more likely to be sent back for reworking than a `confirmed` issue.  If in doubt about the best way to implement something, please create additional conversation on the issue.

Please note that `pull-requests-encouraged` issues with low activity will often be closed without being implemented. These issues are tagged with an additional [`not-implemented`](https://github.com/escrowblock/exchange/issues?utf8=✓&q=label%3Apull-requests-encouraged+label%3Anot-implemented) label, and can still be considered good candidates to work on. If you're interested in working on a closed and `not-implemented` issue, please let us know by posting on that issue.

### Project roles

We’ve just begun to create more defined project roles for ESCB exchange. Here are descriptions of the existing project roles, along with the current contributors taking on those roles today.

#### Issue Triager

Issue Triagers are members of the community that meet with us weekly to help triage ESCB exchange’s open issues and bug reports. Once you’ve begun triaging issues regularly on your own, we will invite you to join our dedicated Slack channel to participate in these regular coordination sessions.

Current Issue Triagers:
- [@logvik](https://github.com/logvik)

#### Reviewer

Our most regular and experienced Issue Triagers sometimes move on to doing code reviews for pull requests, and have input into which pull requests should be merged.

Current Reviewers:
- [@logvik](https://github.com/logvik)

#### Core Committer

For now, the only contributors with commit access to escrowblock/exchange are employees of ESCB exchange Development Group, the company that sponsors the ESCB exchange project.

Project Lead: [@logvik](https://github.com/logvik)

#### Documentation Maintainer

Documentation Maintainers are regular documentation contributors that have been given the ability to merge docs changes on [escrowblock/docs](https://github.com/escrowblock/docs).

Current Documentation Maintainers:
- [@logvik](https://github.com/logvik)

#### Community Package Maintainer:

Community package maintainers are community members who maintain packages outside of ESCB exchange core. This requires code to be extracted from escrowblock/exchange, and entails a high level of responsibility. For this reason, community maintainers generally (and currently) must first become an advanced contributor to ESCB exchange core and have 4-5 non-trivial pull requests merged that went through the proper contribution work-flow. At that point, core contributors may make the case for breaking out a particular core package, and assist in the technical process around doing so.

#### Community Manager

The community manager helps to coordinate resources, documentation, events, and other supportive work needed to ensure the health of the ESCB exchange project.

This role is currently unfilled.

### Tracking project work

Right now, the best place to track the work being done on ESCB exchange is to take a look at the latest release milestone [here](https://github.com/escrowblock/exchange/milestones).  Also, the [ESCB exchange Roadmap](Roadmap.md) contains high-level information on the current priorities of the project.

## Reporting a bug in ESCB exchange
<a name="reporting-bug"></a>

We welcome clear bug reports.  If you've found a bug in ESCB exchange that
isn't a security risk, please file a report in
[our issue tracker](https://github.com/escrowblock/exchange/issues). Before you file your issue, **search** to see if it has already been reported. If so, up-vote (using GitHub reactions) or add additional helpful details to the existing issue to show that it's affecting multiple people.

> There is a separate procedure for security-related issues.  If the
> issue you've found contains sensitive information or raises a security
> concern, email <code>support[]()@[]()escb.exchange</code> instead, which
> will page the security team.

If you want to submit a pull request that fixes your bug, that's even
better.  We love getting bugfix pull requests.  Just make sure they're
written with the [correct style](DEVELOPMENT.md#code-style) and *come with tests*.  Read further down
for more details on proposing changes to core code.

## Feature requests

Feature requests are tracked in the issues tracker.

Every additional feature adds a maintenance cost in addition to its value. This
cost starts with the work of writing the feature or reviewing a community pull
request. In addition to the core code change, attention needs to be paid to
documentation, tests, maintainability, how the feature interacts with existing and
speculative ESCB exchange features, cross-browser/platform support, user experience/API
considerations, etc.  Once the feature is shipped, it then becomes the community's responsibility to fix future bugs related to the feature. In case the original author disappears, it's important that the feature has good tests and is widely used in order to be maintainable by other contributors.

Feature requests should be well specified and unambiguous to have the greatest chance of being worked on by a contributor.

Finally, you can show your support for (or against!) features by using [GitHub reactions](https://github.com/blog/2119-add-reactions-to-pull-requests-issues-and-comments) or by adding meaningful details which help the feature definition become more clear.  Please do not comment with "+1" since it creates a lot of noise (e-mails, notifications, etc.).

## Triaging issues

A great way to contribute to ESCB exchange is by helping keep the issues in the repository clean and well organized. This process is called 'issue triage' and the steps are described [here](ISSUE_TRIAGE.md).

## Documentation

If you'd like to contribute to ESCB exchange's documentation, head over to https://github.com/escrowblock/docs and create issues or pull requests there.

### Understanding the core

For more information about how to work with ESCB exchange core, take a look at the [Development](DEVELOPMENT.md) document which explains many important details, including how to [run from a checkout](DEVELOPMENT.md#running-from-a-git-checkout), [run tests](DEVELOPMENT.md#tests), and more.

### Proposing your change

You'll have the best chance of getting a change into core if you can build consensus in the community for it. Start by creating a well specified feature request as a Github issue, in the [escrowblock/escb-exchange-feature-requests](https://github.com/escrowblock/escb-exchange-feature-requests) repository.

Help drive discussion and advocate for your feature on the Github ticket (and perhaps the forums). The higher the demand for the feature and the greater the clarity of it's specification will determine the likelihood of a core contributor prioritizing your feature by flagging it with the `pull-requests-encouraged` label.

Split features up into smaller, logically separate chunks. It is unlikely that large and complicated PRs will be merged.

Once your feature has been labelled with `pull-requests-encouraged`, leave a comment letting people know you're working on it and you can begin work on the code.

### Submitting pull requests

Once you've come up with a good design, go ahead and submit a pull request (PR). If your PR isn't against a bug with the `confirmed` label or a feature request with the `pull-requests-encouraged` label, don't expect your PR to be merged unless it's a trivial and obvious fix (e.g. documentation). When submitting a PR, please follow these guidelines:

 * Base all your work off of the **devel** branch. The **devel** branch
   is where active development happens.  **We do not merge pull requests
   directly into master.**

 * Name your branch to match the feature/bug fix that you are
   submitting.

 * Limit yourself to one feature or bug fix per pull request.

 * Include tests that prove your code works.

 * Follow appropriate style for
   [code contributions](DEVELOPMENT.md#code-style)
   and
   [commit messages](DEVELOPMENT.md#commit-messages)

 * Be sure your author field in git is properly filled out with your full name
 and email address so we can credit you.

### Need help with your pull request?

If you need help with a pull request, you should start by asking questions in the issue which it pertains to.  If you feel that your pull request is almost ready or needs feedback which can only be demonstrated with code, go ahead and open a pull-request with as much progress as possible.  By including a "[Work in Progress]" note in the subject, project contributors will know you need help!

Submitting a pull request is no guarantee it will be accepted, but contributors will do their best to help move your pull request toward release.

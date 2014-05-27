## Designing a Model Layer

When creating the data layer of an application, it's common for developers to settle on an ActiveRecord pattern (in a nutshell that means one class equals one database table). However, this choice is often done out of tradition rather than based on its merits.

The problem, as it specifically relates to frontend MVC, is that UIs are becoming more focused on end-user needs and the one-entity-type-per-request doesn't always support that end goal well.

Take for example an application's dashboard. It typically displays a summary of various things for the current logged in user, usually ranked in some not-so-trivial way (e.g. five most popular projects, or the projects with the latest activity, or upcoming team vacations, etc). If you think in terms of a traditional SQL database, it's pretty clear that basic CRUD is inadequate: you're going to need some joins, ranking, filtering, and possibly even more complex things like recursiveness - in other words, you're going to be needing the full extent of a modern relational database's features.

When we think of RESTful APIs over HTTP, the years of research and work done in the database world generally feel like an afterthought: we generally represent relationships with URL hacks (e.g. `/user/1/project/10`), but this pattern tends to fall apart with more complex requirements (e.g. one would expect that a "team vacations" resource returns both a list of users hierarchically related to the logged in user, as well as their vacation information: start date, end date, vacation days left, etc (remember vacation can span across weekends or statutory holidays, so that's another join or two depending on the employee's country!).

Consider that this dashboard probably displays some user information. Where should this data come from? One request for the user info, and another for the user's vacations? What about the team? If the dashboard shows other team metrics, where should that basic team info come from? How many HTTP requests are we up to now?

If the dashboard has self-contained customizable widgets, are we requesting duplicate information from different modules?

As you start running into situations like this, it's clear that naively requesting ActiveRecord entries from separate controllers quickly becomes unwieldy.

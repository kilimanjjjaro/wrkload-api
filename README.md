# wrkload API

wrkload API is an easy-to-use API REST developed to be implemented as backend by an app. Gives the possibility to a user to keep organized and documented the time he was working on his tasks.

[API](https://wrkload-api.onrender.com) <sub>(Now the API is a bit slower because it was redeployed on a free Render account.)</sub>

<br>

## Table of Contents

- [Features](#features)
- [Built With](#built-with)
- [Quick Start](#quick-start)
- [API References](#api-references)
  - [Auth API](#auth-api)
  - [Tasks API](#tasks-api)
  - [Projects API](#projects-api)
  - [Users API](#users-api)
- [Environment variables](#environment-variables)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

<br>

## Features

- `Stateless authentication`. Server will loves you ;)
- Restricted requests using `JSON Web Token authorization`.
- `Access tokens` are generated at authentication and they are **signed with the user ID** (in some cases with email or role user) and a **base64 secret key**. Each token are **unique** and **belongs to a single user**. These access tokens are sent by client on the request **via HTTP headers** and the server **verifies that they are valid** and **belong to the owner of the request** before sending a response.
- Access tokens have a **short life cycle**, they expire each 15 minutes. Here the `refresh tokens` make his job, they **generate new access tokens in the same way as expired access tokens was generated** but in **client side background**.
- Refresh tokens are used **only for generate new access tokens**, not for authorization. This is why they **expire after 30 days**, to ensure that user doesn't have to login every 15 minutes.
- The refresh tokens are set on the client from the server as HttpOnly and secure cookies. They can only be accessed through the browser via HTTPS requests, not with Javascript.
- `Confirmation of accounts` and `reset passwords` by email with **unique**, **one-time use** and **expiration times** links.
- `Responses filtered` based on user role.
- `Paginated APIs` with detailed responses, including number of **items per page**, **items in total**, **number of current**, **previous** and **next page**.
- `User role system`, this opens the way for a lot of frontend-side implementations, like querying registered users, non-sensitive user data, types of uploaded projects, tasks by users, create role permissions, etc.
- Users **only can read, update or delete own tasks**, even users with administration role.
- Users **can create and store** useful information about their tasks such as: timing, project, delivery day, task type, a short description that can be used as a note book.
- Thanks to this information, **statistics** are calculated and returned on how many hours were worked and how many tasks were assigned per project in the current and past month.
- `User passwords are salt (10 rounds) and hash with the Blowfish cipher` before being saved on database.
- You can have user session information such as: the last time it was active or when it was registered.
- You can see `when a user was last active` or `when they signed up`. You can also check `when a task was created or updated`.

<br>

## Built With

- [Node.js](https://github.com/nodejs/node)
- [Express.js](https://github.com/expressjs/express)
- [Express validator](https://github.com/express-validator/express-validator)
- [Mongoose](https://github.com/Automattic/mongoose)
- [JSON Web Tokens](https://jwt.io/)
- [bcrypt.js](https://github.com/dcodeIO/bcrypt.js)
- [cookie-parser](https://github.com/expressjs/cookie-parser)
- [cors](https://github.com/expressjs/cors)
- [dotenv](https://github.com/motdotla/dotenv)
- [Nodemailer](https://github.com/nodemailer/nodemailer)
- [day.js](https://github.com/iamkun/dayjs/)
- [nodemon](https://github.com/remy/nodemon)

<br>

## Quick Start

The quickest way to run this server on your localhost is execute the following commands:

Install dependencies

```console
$ npm install
```

Start the server with nodemon

```console
$ npm run dev
```

Start the server with node

```console
$ npm run start
```

Open [http://localhost:5000](http://localhost:5000) with your browser.

<br>

## API References

### Auth API

This API provides an authentication and authorization system developed to validate the requests to the other APIs. In addition to functions as register, login or logout, can confirm an account by email, reset or change a password, generate new access tokens. Please, check the details to know its implementation.

<details>
<summary>See all details</summary>

#### — Register

```
  POST /api/v1/auth/register
```

| Request body | Type     | Required | Description                        |
| ------------ | -------- | -------- | ---------------------------------- |
| `username`   | `string` | `true`   | Name of the new user.              |
| `email`      | `string` | `true`   | Valid email of the new user.       |
| `avatar`     | `string` | `true`   | URL of image.                      |
| `password`   | `string` | `true`   | Password of at least 8 characters. |

| Response body | Type     | Description                                                             |
| ------------- | -------- | ----------------------------------------------------------------------- |
| `status`      | `string` | In the case of error a `code` and `message` property will be populated. |

<br>

#### — Login

```
  POST /api/v1/auth/login
```

| Request body | Type     | Required | Description                        |
| ------------ | -------- | -------- | ---------------------------------- |
| `email`      | `string` | `true`   | Valid email of the new user.       |
| `password`   | `string` | `true`   | Password of at least 8 characters. |

| Response body     | Type     | Description                                                             |
| ----------------- | -------- | ----------------------------------------------------------------------- |
| `status`          | `string` | In the case of error a `code` and `message` property will be populated. |
| `user`            | `object` | User object.                                                            |
| `user`.`_id`      | `string` | User ID.                                                                |
| `user`.`username` | `string` | Name of user.                                                           |
| `user`.`role`     | `number` | Role of user.                                                           |
| `user`.`email`    | `string` | Valid email of new user.                                                |
| `user`.`avatar`   | `string` | URL of image.                                                           |
| `accessToken`     | `string` | Valid access token to be included in request headers.                   |
| `expiresIn`       | `number` | Validity time in seconds of the access token.                           |

<br>

#### — Confirm account

##### Link with confirmation token sent by email.

```
  PATCH /api/v1/auth/confirm-account/${confirmationToken}
```

| Request parameters  | Type     | Required | Description                                                    |
| ------------------- | -------- | -------- | -------------------------------------------------------------- |
| `confirmationToken` | `string` | `true`   | Valid JWT token generated at registry and distributed by mail. |

| Response body | Type     | Description                                                             |
| ------------- | -------- | ----------------------------------------------------------------------- |
| `status`      | `string` | In the case of error a `code` and `message` property will be populated. |

<br>

#### — Resend confirm account link

```
  POST /api/v1/auth/resend-confirm-account
```

| Request body | Type     | Required | Description                  |
| ------------ | -------- | -------- | ---------------------------- |
| `email`      | `string` | `true`   | Valid email of the new user. |

| Response body | Type     | Description                                                             |
| ------------- | -------- | ----------------------------------------------------------------------- |
| `status`      | `string` | In the case of error a `code` and `message` property will be populated. |

<br>

#### — Change password

```
  PATCH /api/v1/auth/change-password
```

| HTTP Headers    | Type           | Required | Description                                                       |
| --------------- | -------------- | -------- | ----------------------------------------------------------------- |
| `Authorization` | `bearer token` | `true`   | Valid JWT token generated at login and stored in a secure cookie. |

| Request body  | Type     | Required | Description                        |
| ------------- | -------- | -------- | ---------------------------------- |
| `email`       | `string` | `true`   | Valid email of the new user.       |
| `oldPassword` | `string` | `true`   | Password of at least 8 characters. |
| `newPassword` | `string` | `true`   | Password of at least 8 characters. |

| Response body | Type     | Description                                                             |
| ------------- | -------- | ----------------------------------------------------------------------- |
| `status`      | `string` | In the case of error a `code` and `message` property will be populated. |

<br>

#### — Remember password

```
  POST /api/v1/auth/remember-password
```

| Request body | Type     | Required | Description                  |
| ------------ | -------- | -------- | ---------------------------- |
| `email`      | `string` | `true`   | Valid email of the new user. |

| Response body | Type     | Description                                                             |
| ------------- | -------- | ----------------------------------------------------------------------- |
| `status`      | `string` | In the case of error a `code` and `message` property will be populated. |

<br>

#### — Reset password

```
  PATCH /api/v1/auth/reset-password/${uid}/${resetPasswordToken}
```

| Request parameters   | Type     | Required | Description                                           |
| -------------------- | -------- | -------- | ----------------------------------------------------- |
| `uid`                | `string` | `true`   | User ID.                                              |
| `resetPasswordToken` | `string` | `true`   | Valid JWT token generated at forgot password request. |

| Request body  | Type     | Required | Description                        |
| ------------- | -------- | -------- | ---------------------------------- |
| `newPassword` | `string` | `true`   | Password of at least 8 characters. |

| Response body | Type     | Description                                                             |
| ------------- | -------- | ----------------------------------------------------------------------- |
| `status`      | `string` | In the case of error a `code` and `message` property will be populated. |

<br>

#### — Logout

```
  GET /api/v1/auth/logout
```

| Cookies        | Type       | Required | Description                                                                                 |
| -------------- | ---------- | -------- | ------------------------------------------------------------------------------------------- |
| `refreshToken` | `HttpOnly` | `true`   | Valid JWT token generated at login stored in cookie only accessible through https requests. |

| Response body | Type     | Description                                                             |
| ------------- | -------- | ----------------------------------------------------------------------- |
| `status`      | `string` | In the case of error a `code` and `message` property will be populated. |

<br>

#### — Refresh access token

```
  GET /api/v1/auth/refreshToken
```

| Cookies        | Type       | Required | Description                                                                  |
| -------------- | ---------- | -------- | ---------------------------------------------------------------------------- |
| `refreshToken` | `HttpOnly` | `true`   | Valid JWT token generated at login and stored as HttpOnly and secure cookie. |

| Response body | Type     | Description                                                             |
| ------------- | -------- | ----------------------------------------------------------------------- |
| `status`      | `string` | In the case of error a `code` and `message` property will be populated. |
| `accessToken` | `string` | Valid access token to be included in request headers.                   |
| `expiresIn`   | `number` | Validity time in seconds of the access token.                           |

</details>

### Tasks API

This API provides a tasks management system. You can request all tasks or a single tasks, also you can create, edit, update or delete tasks. Please, check the details to know its implementation.

<details>
<summary>See all details</summary>

#### — Get all tasks

##### Only users with administrator role can read tasks from other users.

```
  GET /api/v1/tasks
```

| HTTP Headers    | Type           | Required | Description                                                       |
| --------------- | -------------- | -------- | ----------------------------------------------------------------- |
| `Authorization` | `bearer token` | `true`   | Valid JWT token generated at login and stored in a secure cookie. |

| Request parameters | Type     | Required | Description                               |
| ------------------ | -------- | -------- | ----------------------------------------- |
| `project`          | `string` | `true`   | The name of project.                      |
| `limit`            | `string` | `false`  | The number of results per page to return. |
| `page`             | `string` | `false`  | Use this to page through the results.     |
| `search`           | `string` | `false`  | Search by title.                          |

| Response body                     | Type     | Description                                                             |
| --------------------------------- | -------- | ----------------------------------------------------------------------- |
| `status`                          | `string` | In the case of error a `code` and `message` property will be populated. |
| `pagination`                      | `object` | Pagination data object with following propierties.                      |
| `pagination`.`totalResults`       | `number` | The total number of results available for your request.                 |
| `pagination`.`resultsPerPage`     | `number` | The number of results available per page.                               |
| `pagination`.`prevPage`           | `number` | The number of previous page.                                            |
| `pagination`.`page`               | `number` | The number of actual page.                                              |
| `pagination`.`nextPage`           | `number` | The number of next page.                                                |
| `results`                         | `array`  | The results of the request.                                             |
| `results`.`_id`                   | `string` | Task ID.                                                                |
| `results`.`title`                 | `string` | Title of task.                                                          |
| `results`.`authorId`              | `string` | Author ID of task.                                                      |
| `results`.`createdAt`             | `string` | Task create date in ISO8601 format.                                     |
| `results`.`updatedAt`             | `string` | Task update date in ISO8601 format.                                     |
| `results`.`project`               | `string` | Task project name.                                                      |
| `results`.`timing`                | `string` | Time the task was completed.                                            |
| `results`.`delivered`             | `string` | Date the task was completed. ISO8601 format required.                   |
| `results`.`description`           | `string` | Description of the task.                                                |
| `stats`                           | `object` | The stats of the request.                                               |
| `stats`.`totalPastMonthTiming`    | `number` | Total time of tasks completed in the past month.                        |
| `stats`.`totalTasksPastMonth`     | `number` | Total tasks completed in the past month.                                |
| `stats`.`totalCurrentMonthTiming` | `number` | Total time of tasks completed in the current month.                     |
| `stats`.`totalTasksCurrentMonth`  | `number` | Total tasks completed in the current month.                             |
| `stats`.`performance`             | `string` | Performance between the current month and the past                      |

<br>

#### — Get task

##### You can only read own tasks, except users with administrator role.

```
  GET /api/v1/tasks/${id}
```

| HTTP Headers    | Type           | Required | Description                                                       |
| --------------- | -------------- | -------- | ----------------------------------------------------------------- |
| `Authorization` | `bearer token` | `true`   | Valid JWT token generated at login and stored in a secure cookie. |

| Request parameters | Type     | Required | Description |
| ------------------ | -------- | -------- | ----------- |
| `id`               | `string` | `true`   | Task ID.    |

| Response body          | Type     | Description                                                             |
| ---------------------- | -------- | ----------------------------------------------------------------------- |
| `status`               | `string` | In the case of error a `code` and `message` property will be populated. |
| `result`               | `object` | The result of the request.                                              |
| `result`.`_id`         | `string` | Task ID.                                                                |
| `result`.`title`       | `string` | Title of task.                                                          |
| `result`.`authorId`    | `string` | Author ID of task.                                                      |
| `result`.`createdAt`   | `string` | Task create date in ISO8601 format.                                     |
| `result`.`updatedAt`   | `string` | Task update date in ISO8601 format.                                     |
| `result`.`project`     | `string` | Task project name.                                                      |
| `result`.`timing`      | `string` | Time the task was completed.                                            |
| `result`.`delivered`   | `string` | Date the task was completed. ISO8601 format required.                   |
| `result`.`description` | `string` | Description of the task.                                                |

<br>

#### — Create task

```
  POST /api/v1/tasks
```

| HTTP Headers    | Type           | Required | Description                                                       |
| --------------- | -------------- | -------- | ----------------------------------------------------------------- |
| `Authorization` | `bearer token` | `true`   | Valid JWT token generated at login and stored in a secure cookie. |

| Request body  | Type     | Required | Description                                           |
| ------------- | -------- | -------- | ----------------------------------------------------- |
| `title`       | `string` | `true`   | Title of task.                                        |
| `project`     | `string` | `true`   | Task project name.                                    |
| `timing`      | `string` | `true`   | Time the task was completed.                          |
| `delivered`   | `string` | `true`   | Date the task was completed. ISO8601 format required. |
| `description` | `string` | `false`  | Description of the task.                              |

| Response body           | Type     | Description                                                             |
| ----------------------- | -------- | ----------------------------------------------------------------------- |
| `status`                | `string` | In the case of error a `code` and `message` property will be populated. |
| `newTask`               | `object` | The new task created.                                                   |
| `newTask`.`_id`         | `string` | Task ID.                                                                |
| `newTask`.`title`       | `string` | Title of task.                                                          |
| `newTask`.`authorId`    | `string` | Author ID of task.                                                      |
| `newTask`.`createdAt`   | `string` | Task create date in ISO8601 format.                                     |
| `newTask`.`updatedAt`   | `string` | Task update date in ISO8601 format.                                     |
| `newTask`.`project`     | `string` | Task project name.                                                      |
| `newTask`.`timing`      | `string` | Time the task was completed.                                            |
| `newTask`.`delivered`   | `string` | Date the task was completed. ISO8601 format required.                   |
| `newTask`.`description` | `string` | Description of the task.                                                |

<br>

#### — Update task

##### You can only update own tasks, even the admin can't update yours either.

```
  PATCH /api/v1/tasks/${id}
```

| HTTP Headers    | Type           | Required | Description                                                       |
| --------------- | -------------- | -------- | ----------------------------------------------------------------- |
| `Authorization` | `bearer token` | `true`   | Valid JWT token generated at login and stored in a secure cookie. |

| Request parameters | Type     | Required | Description |
| ------------------ | -------- | -------- | ----------- |
| `id`               | `string` | `true`   | Task ID.    |

| Request body  | Type     | Required | Description                   |
| ------------- | -------- | -------- | ----------------------------- |
| `title`       | `string` | `false`  | Title of task.                |
| `project`     | `string` | `false`  | Task project name.            |
| `timing`      | `string` | `false`  | Time the task was completed.  |
| `month`       | `string` | `false`  | Month the task was completed. |
| `delivered`   | `string` | `false`  | Date the task was completed.  |
| `description` | `string` | `false`  | Description of the task.      |

| Response body               | Type     | Description                                                             |
| --------------------------- | -------- | ----------------------------------------------------------------------- |
| `status`                    | `string` | In the case of error a `code` and `message` property will be populated. |
| `updatedTask`               | `object` | The task updated.                                                       |
| `updatedTask`.`_id`         | `string` | Task ID.                                                                |
| `updatedTask`.`title`       | `string` | Title of task.                                                          |
| `updatedTask`.`authorId`    | `string` | Author ID of task.                                                      |
| `updatedTask`.`createdAt`   | `string` | Task create date in ISO8601 format.                                     |
| `updatedTask`.`updatedAt`   | `string` | Task update date in ISO8601 format.                                     |
| `updatedTask`.`project`     | `string` | Task project name.                                                      |
| `updatedTask`.`timing`      | `string` | Time the task was completed.                                            |
| `updatedTask`.`delivered`   | `string` | Date the task was completed. ISO8601 format required.                   |
| `updatedTask`.`description` | `string` | Description of the task.                                                |

<br>

#### — Delete task

##### You can only delete own tasks.

```
  DELETE /api/v1/tasks/${id}
```

| HTTP Headers    | Type           | Required | Description                                                       |
| --------------- | -------------- | -------- | ----------------------------------------------------------------- |
| `Authorization` | `bearer token` | `true`   | Valid JWT token generated at login and stored in a secure cookie. |

| Request parameters | Type     | Required | Description |
| ------------------ | -------- | -------- | ----------- |
| `id`               | `string` | `true`   | ID task.    |

| Response body | Type     | Description                                                             |
| ------------- | -------- | ----------------------------------------------------------------------- |
| `status`      | `string` | In the case of error a `code` and `message` property will be populated. |

</details>

### Projects API

This API provides a project management system. You can request all projects or a single project, also you can create, edit, update or delete projects. Please, check the details to know its implementation.

<details>
<summary>See all details</summary>

#### — Get all projects

##### Only users with administrator role can read projects from other users.

```
  GET /api/v1/projects
```

| HTTP Headers    | Type           | Required | Description                                                       |
| --------------- | -------------- | -------- | ----------------------------------------------------------------- |
| `Authorization` | `bearer token` | `true`   | Valid JWT token generated at login and stored in a secure cookie. |

| Request parameters | Type     | Required | Description                               |
| ------------------ | -------- | -------- | ----------------------------------------- |
| `limit`            | `string` | `false`  | The number of results per page to return. |
| `page`             | `string` | `false`  | Use this to page through the results.     |
| `search`           | `string` | `false`  | Search by title.                          |

| Response body                    | Type     | Description                                                             |
| -------------------------------- | -------- | ----------------------------------------------------------------------- |
| `status`                         | `string` | In the case of error a `code` and `message` property will be populated. |
| `pagination`                     | `object` | Pagination data object with following propierties.                      |
| `pagination`.`totalResults`      | `number` | The total number of results available for your request.                 |
| `pagination`.`resultsPerPage`    | `number` | The number of results available per page.                               |
| `pagination`.`prevPage`          | `number` | The number of previous page.                                            |
| `pagination`.`page`              | `number` | The number of actual page.                                              |
| `pagination`.`nextPage`          | `number` | The number of next page.                                                |
| `results`                        | `array`  | The results of the request.                                             |
| `results`.`_id`                  | `string` | Project ID.                                                             |
| `results`.`name`                 | `string` | Name of project.                                                        |
| `results`.`authorId`             | `string` | Author ID of project.                                                   |
| `results`.`createdAt`            | `string` | Project create date in ISO8601 format.                                  |
| `results`.`totalTasks`           | `number` | Total tasks of project.                                                 |
| `stats`                          | `object` | The stats of the request.                                               |
| `stats`.`bestProjectOfPastMonth` | `string` | The name of best project with more tasks in the past month.             |

<br>

#### — Get project

##### You can only read own projects, except users with administrator role.

```
  GET /api/v1/projects/${id}
```

| HTTP Headers    | Type           | Required | Description                                                       |
| --------------- | -------------- | -------- | ----------------------------------------------------------------- |
| `Authorization` | `bearer token` | `true`   | Valid JWT token generated at login and stored in a secure cookie. |

| Request parameters | Type     | Required | Description |
| ------------------ | -------- | -------- | ----------- |
| `id`               | `string` | `true`   | Project ID. |

| Response body          | Type     | Description                                                             |
| ---------------------- | -------- | ----------------------------------------------------------------------- |
| `status`               | `string` | In the case of error a `code` and `message` property will be populated. |
| `results`              | `array`  | The result of the request.                                              |
| `results`.`_id`        | `string` | Project ID.                                                             |
| `results`.`name`       | `string` | Name of project.                                                        |
| `results`.`authorId`   | `string` | Author ID of project.                                                   |
| `results`.`createdAt`  | `string` | Project create date in ISO8601 format.                                  |
| `results`.`totalTasks` | `number` | Total tasks of project.                                                 |

<br>

#### — Create project

```
  POST /api/v1/projects
```

| HTTP Headers    | Type           | Required | Description                                                       |
| --------------- | -------------- | -------- | ----------------------------------------------------------------- |
| `Authorization` | `bearer token` | `true`   | Valid JWT token generated at login and stored in a secure cookie. |

| Request body | Type     | Required | Description      |
| ------------ | -------- | -------- | ---------------- |
| `name`       | `string` | `true`   | Name of project. |

| Response body            | Type     | Description                                                             |
| ------------------------ | -------- | ----------------------------------------------------------------------- |
| `status`                 | `string` | In the case of error a `code` and `message` property will be populated. |
| `newProject`             | `object` | The new project created.                                                |
| `newProject`.`_id`       | `string` | Project ID.                                                             |
| `newProject`.`name`      | `string` | Name of project.                                                        |
| `newProject`.`authorId`  | `string` | Author ID of project.                                                   |
| `newProject`.`createdAt` | `string` | Project create date in ISO8601 format.                                  |

<br>

#### — Update project

##### You can only update own projects, even the admin can't update yours either.

```
  PATCH /api/v1/projects/${id}
```

| HTTP Headers    | Type           | Required | Description                                                       |
| --------------- | -------------- | -------- | ----------------------------------------------------------------- |
| `Authorization` | `bearer token` | `true`   | Valid JWT token generated at login and stored in a secure cookie. |

| Request parameters | Type     | Required | Description |
| ------------------ | -------- | -------- | ----------- |
| `id`               | `string` | `true`   | Project ID. |

| Request body | Type     | Required | Description      |
| ------------ | -------- | -------- | ---------------- |
| `name`       | `string` | `false`  | Name of project. |

| Response body                | Type     | Description                                                             |
| ---------------------------- | -------- | ----------------------------------------------------------------------- |
| `status`                     | `string` | In the case of error a `code` and `message` property will be populated. |
| `updatedProject`             | `object` | The project updated.                                                    |
| `updatedProject`.`_id`       | `string` | Project ID.                                                             |
| `updatedProject`.`name`      | `string` | Name of project.                                                        |
| `updatedProject`.`authorId`  | `string` | Author ID of project.                                                   |
| `updatedProject`.`createdAt` | `string` | Project create date in ISO8601 format.                                  |

<br>

#### — Delete project

##### You can only delete own projects.

```
  DELETE /api/v1/projects/${id}
```

| HTTP Headers    | Type           | Required | Description                                                       |
| --------------- | -------------- | -------- | ----------------------------------------------------------------- |
| `Authorization` | `bearer token` | `true`   | Valid JWT token generated at login and stored in a secure cookie. |

| Request parameters | Type     | Required | Description |
| ------------------ | -------- | -------- | ----------- |
| `id`               | `string` | `true`   | Project ID. |

| Response body | Type     | Description                                                             |
| ------------- | -------- | ----------------------------------------------------------------------- |
| `status`      | `string` | In the case of error a `code` and `message` property will be populated. |

</details>

### Users API

This API provides an users management system. You can request all users or a single user, also you can update or delete users. Please, check the details to know its implementation.

<details>
<summary>See all details</summary>

#### — Get all users

##### Only for users with administrator role.

```
  GET /api/v1/users
```

| HTTP Headers    | Type           | Required | Description                                                       |
| --------------- | -------------- | -------- | ----------------------------------------------------------------- |
| `Authorization` | `bearer token` | `true`   | Valid JWT token generated at login and stored in a secure cookie. |

| Request parameters | Type     | Required | Description                               |
| ------------------ | -------- | -------- | ----------------------------------------- |
| `limit`            | `string` | `false`  | The number of results per page to return. |
| `page`             | `string` | `false`  | Use this to page through the results.     |
| `search`           | `string` | `false`  | Search by title.                          |

| Response body                   | Type      | Description                                                             |
| ------------------------------- | --------- | ----------------------------------------------------------------------- |
| `status`                        | `string`  | In the case of error a `code` and `message` property will be populated. |
| `pagination`                    | `object`  | Pagination data object with following propierties.                      |
| `pagination`.`totalResults`     | `number`  | The total number of results available for your request.                 |
| `pagination`.`resultsPerPage`   | `number`  | The number of results available per page.                               |
| `pagination`.`prevPage`         | `number`  | The number of previous page.                                            |
| `pagination`.`page`             | `number`  | The number of actual page.                                              |
| `pagination`.`nextPage`         | `number`  | The number of next page.                                                |
| `results`                       | `array`   | The results of the request.                                             |
| `results`.`_id`                 | `string`  | User ID.                                                                |
| `results`.`username`            | `string`  | Name of user.                                                           |
| `results`.`registeredAt`        | `string`  | User registry date in ISO8601 format.                                   |
| `results`.`lastActiveAt`        | `string`  | Date in ISO8601 format of the last time the user was active.            |
| `results`.`role`                | `number`  | Role of user.                                                           |
| `results`.`email`               | `string`  | Valid email of new user.                                                |
| `results`.`avatar`              | `string`  | URL of image.                                                           |
| `results`.`confirmationToken`   | `string`  | Valid JWT token generated at registry.                                  |
| `results`.`confirmation_status` | `boolean` | Account status.                                                         |

<br>

#### — Get user

##### You can only read your own data. Full response for users with administrator role.

```
  GET /api/v1/users/${uid}
```

| HTTP Headers    | Type           | Required | Description                                                      |
| --------------- | -------------- | -------- | ---------------------------------------------------------------- |
| `Authorization` | `bearer token` | `true`   | Valu JWT token generated at login and stored in a secure cookie. |

| Request parameters | Type     | Required | Description |
| ------------------ | -------- | -------- | ----------- |
| `uid`              | `string` | `true`   | User ID.    |

| Response body                  | Type      | Description                                                             |
| ------------------------------ | --------- | ----------------------------------------------------------------------- |
| `status`                       | `string`  | In the case of error a `code` and `message` property will be populated. |
| `result`                       | `object`  | The result of the request.                                              |
| `result`.`_id`                 | `string`  | User ID.                                                                |
| `result`.`username`            | `string`  | Name of user.                                                           |
| `result`.`role`                | `number`  | Role of user.                                                           |
| `result`.`registeredAt`        | `string`  | User registry date in ISO8601 format.                                   |
| `result`.`lastActiveAt`        | `string`  | Date in ISO8601 format of the last time the user was active.            |
| `result`.`email`               | `string`  | Valid email of new user.                                                |
| `result`.`avatar`              | `string`  | URL of image.                                                           |
| `result`.`confirmationToken`   | `string`  | Valid JWT token generated at registry.                                  |
| `result`.`confirmation_status` | `boolean` | Account status.                                                         |

<br>

#### — Update user

##### You can only update your data, even the admin can't update you either.

```
  PATCH /api/v1/users/${uid}
```

| HTTP Headers    | Type           | Required | Description                                                       |
| --------------- | -------------- | -------- | ----------------------------------------------------------------- |
| `Authorization` | `bearer token` | `true`   | Valid JWT token generated at login and stored in a secure cookie. |

| Request parameters | Type     | Required | Description |
| ------------------ | -------- | -------- | ----------- |
| `uid`              | `string` | `true`   | User ID.    |

| Request body | Type     | Description              |
| ------------ | -------- | ------------------------ |
| `username`   | `string` | New name of user.        |
| `email`      | `string` | New valid email of user. |
| `avatar`     | `string` | URL of new image.        |

| Response body     | Type     | Description                                                             |
| ----------------- | -------- | ----------------------------------------------------------------------- |
| `status`          | `string` | In the case of error a `code` and `message` property will be populated. |
| `user`            | `object` | The user of the request.                                                |
| `user`.`_id`      | `string` | User ID.                                                                |
| `user`.`email`    | `string` | Valid email of new user.                                                |
| `user`.`username` | `string` | Name of user.                                                           |
| `user`.`avatar`   | `string` | URL of image.                                                           |
| `user`.`role`     | `number` | Role of user.                                                           |

<br>

#### — Delete user

##### Only for users with administrator role.

```
  DELETE /api/v1/users/${uid}
```

| HTTP Headers    | Type           | Required | Description                                                       |
| --------------- | -------------- | -------- | ----------------------------------------------------------------- |
| `Authorization` | `bearer token` | `true`   | Valid JWT token generated at login and stored in a secure cookie. |

| Request parameters | Type     | Required | Description |
| ------------------ | -------- | -------- | ----------- |
| `uid`              | `string` | `true`   | User ID.    |

| Response body | Type     | Description                                                             |
| ------------- | -------- | ----------------------------------------------------------------------- |
| `status`      | `string` | In the case of error a `code` and `message` property will be populated. |

</details>

<br>

## Environment variables

To run this server, you must create an .env file in the root of your project with the following variables. Remember to also set these on your hosting when you go to production mode:

| Key                        | Type     | Description                                           |
| -------------------------- | -------- | ----------------------------------------------------- |
| `DATABASE`                 | `string` | Link to your MongoDB connection.                      |
| `ACCESS_KEY`               | `string` | Secret key to sign your access tokens.                |
| `REFRESH_KEY`              | `string` | Secret key to sign your refresh tokens.               |
| `CONFIRMATION_ACCOUNT_KEY` | `string` | Secret key to sign your confirmation account tokens.  |
| `RESET_PASSWORD_KEY`       | `string` | Secret key to sign your reset password tokens.        |
| `EMAIL_USER`               | `string` | Email account to be used with nodemailer.             |
| `EMAIL_PASS`               | `string` | Password of email account to be used with nodemailer. |
| `FRONTEND_URL`             | `string` | Link to client side, e.g.: http://localhost:7000      |
| `BACKEND_URL`              | `string` | Link to server side, e.g.: http://localhost:5000      |

To generate base64 secret keys you can use [_GeneratePlus_](https://generate.plus/en/base64).

<br>

## Roadmap

Keeping in mind that the reason of to be of this project is to learn, I want to continue expanding it and these are the next challenges.

- [x] Items per page and pagination params to GET requests.
- [x] Unique access and refresh tokens per user.
- [ ] Add date filter on tasks.
- [ ] Requests by projects or by the name or type of task.
- [ ] Design mails for confirmation account, resend account confirmation and forgot password.
- [ ] Refactor the code to use Postgres Database with Supabase instead of MongoDB and Google Firebase.
- [ ] Automatically calculate earned objectives based on the time it takes to complete a task and the budget that the project has to pay this.
- [ ] Stateful sessions (maybe?).

Obviously, you can suggest new challenges on [GitHub discussions](https://github.com/kilimanjjjaro/wrkload-api/discussions) or via email (located in [Github profile page](https://github.com/kilimanjjjaro)).

<br>

## Contributing

First off, thanks for taking the time to contribute! Any contributions you make will benefit everybody else (especially me) and are **greatly appreciated**.

Please be kind and try to create bug reports that are:

- _Reproducible._ Include steps to reproduce the problem.
- _Specific._ Include as much detail as possible: which version, what environment, etc.
- _Unique._ Do not duplicate existing opened issues.
- _Scoped to a Single Bug._ One bug per report.

[Go to issues](https://github.com/kilimanjjjaro/wrkload-api/issues)

<br>

## License

This project was developed under the **GPL-3.0 license**, see the [LICENSE](./LICENSE.md) file in the project root for the full license text.

<br>

## Acknowledgements

I am grateful to these incredible resources and guys who directly or indirectly helped me in the development of this project:

- <https://mailtrap.io>
- <https://www.thunderclient.com>
- <https://www.grc.com/passwords.htm>
- <https://unlayer.com>
- <https://code.visualstudio.com>
- <https://stackoverflow.com>
- <https://yerbaverdeflor.com>
- <https://github.com/midudev>
- <https://github.com/bluuweb>
- <https://github.com/Walterisimo>
- <https://github.com/Nahuelnp>
- <https://github.com/domini-code>

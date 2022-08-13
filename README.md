# wrkload API

wrkload API is a simple, easy-to-use API REST developed to be used as backend by an app. It offers the possibility to a user to keep organized and documented the time he was working on his tasks.

<br>

## Table of Contents

- [About](#about)
  - [Built With](#built-with)
- [Quick Start](#quick-start)
- [API References](#api-references)
  - [Auth API](#auth-api)
  - [Tasks API](#tasks-api)
  - [Users API](#users-api)
- [Environment variables](#environment-variables)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

<br>

## About

wrkload API is a simple, easy-to-use API REST developed to be used as backend by an app. It offers the possibility to a user to keep organized and documented the time he was working on his tasks.

**Key features of wrkload API**

- Configurable README.md template

<br>

## Built With

- [Node.js](https://github.com/nodejs/node)
- [Express.js](https://github.com/expressjs/express)
- [Express validator](https://github.com/express-validator/express-validator)
- [MongoDB](https://www.mongodb.com/)
- [Mongoose](https://github.com/Automattic/mongoose)
- [JSON Web Tokens](https://jwt.io/)
- [bcrypt.js](https://github.com/dcodeIO/bcrypt.js)
- [cookie-parser](https://github.com/expressjs/cookie-parser)
- [cors](https://github.com/expressjs/cors)
- [dotenv](https://github.com/motdotla/dotenv)
- [Nodemailer](https://github.com/nodemailer/nodemailer)
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

View the server at `http://localhost:PORT`

<br>

## API References

### Auth API

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi eleifend turpis sit amet lacus porta elementum id id mi. Aenean sed dui sit amet risus euismod feugiat sit amet at dolor. Sed tristique volutpat ullamcorper.

<details>
<summary>See all details</summary>

#### Register

```
  POST /api/v1/auth/register
```

| Request body | Type     | Required | Description                        |
| ------------ | -------- | -------- | ---------------------------------- |
| `username`   | `string` | `true`   | Name of the new user.              |
| `email`      | `string` | `true`   | Valid email of the new user.       |
| `avatar`     | `string` | `true`   | URL of image.                      |
| `password`   | `string` | `true`   | Password of at least 8 characters. |

<br>

#### Login

```
  POST /api/v1/auth/login
```

| Request body | Type     | Required | Description                        |
| ------------ | -------- | -------- | ---------------------------------- |
| `email`      | `string` | `true`   | Valid email of the new user.       |
| `password`   | `string` | `true`   | Password of at least 8 characters. |

<br>

#### Confirm account

##### Link with confirmation token sent by email.

```
  PATCH /api/v1/auth/confirm-account/${confirmation_token}
```

| Request parameters   | Type     | Required | Description                                                    |
| -------------------- | -------- | -------- | -------------------------------------------------------------- |
| `confirmation_token` | `string` | `true`   | Valid JWT token generated at registry and distributed by mail. |

<br>

#### Resend confirm account link

```
  POST /api/v1/auth/resend-confirm-account
```

| Request body | Type     | Required | Description                  |
| ------------ | -------- | -------- | ---------------------------- |
| `email`      | `string` | `true`   | Valid email of the new user. |

<br>

#### Change password

```
  PATCH /api/v1/auth/change-password
```

| HTTP Headers    | Type           | Required | Description                                              |
| --------------- | -------------- | -------- | -------------------------------------------------------- |
| `Authorization` | `bearer token` | `true`   | Valid JWT token generated at login and stored in memory. |

| Request body   | Type     | Required | Description                        |
| -------------- | -------- | -------- | ---------------------------------- |
| `email`        | `string` | `true`   | Valid email of the new user.       |
| `old_password` | `string` | `true`   | Password of at least 8 characters. |
| `new_password` | `string` | `true`   | Password of at least 8 characters. |

<br>

#### Forgot password

```
  POST /api/v1/auth/forgot-password
```

| Request body | Type     | Required | Description                  |
| ------------ | -------- | -------- | ---------------------------- |
| `email`      | `string` | `true`   | Valid email of the new user. |

<br>

#### Reset password

```
  PATCH /api/v1/auth/reset-password/${uid}/${reset_password_token}
```

| Request parameters     | Type     | Required | Description                                           |
| ---------------------- | -------- | -------- | ----------------------------------------------------- |
| `uid`                  | `string` | `true`   | User ID.                                              |
| `reset_password_token` | `string` | `true`   | Valid JWT token generated at forgot password request. |

| Request body   | Type     | Required | Description                        |
| -------------- | -------- | -------- | ---------------------------------- |
| `new_password` | `string` | `true`   | Password of at least 8 characters. |

<br>

#### Logout

```
  GET /api/v1/auth/logout
```

| Cookies         | Type       | Required | Description                                                                                 |
| --------------- | ---------- | -------- | ------------------------------------------------------------------------------------------- |
| `refresh_token` | `HttpOnly` | `true`   | Valid JWT token generated at login stored in cookie only accessible through https requests. |

<br>

#### Access token re-generator

```
  GET /api/v1/auth/token
```

| HTTP Headers    | Type           | Required | Description                                              |
| --------------- | -------------- | -------- | -------------------------------------------------------- |
| `Authorization` | `bearer token` | `true`   | Valid JWT token generated at login and stored in memory. |

| Cookies         | Type       | Required | Description                                                                                     |
| --------------- | ---------- | -------- | ----------------------------------------------------------------------------------------------- |
| `refresh_token` | `HttpOnly` | `true`   | Valid JWT token generated at login and stored in cookie only accessible through https requests. |

</details>

### Tasks API

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi eleifend turpis sit amet lacus porta elementum id id mi. Aenean sed dui sit amet risus euismod feugiat sit amet at dolor. Sed tristique volutpat ullamcorper.

<details>
<summary>See all details</summary>

#### Get all tasks

##### Only for users with administrator role.

```
  GET /api/v1/tasks
```

| HTTP Headers    | Type           | Required | Description                                              |
| --------------- | -------------- | -------- | -------------------------------------------------------- |
| `Authorization` | `bearer token` | `true`   | Valid JWT token generated at login and stored in memory. |

| Request parameters | Type     | Required | Description                               |
| ------------------ | -------- | -------- | ----------------------------------------- |
| `per_page`         | `string` | `false`  | The number of results to return per page. |
| `page`             | `string` | `false`  | Use this to page through the results.     |

| Response body | Type     | Description                                           |
| ------------- | -------- | ----------------------------------------------------- |
| `_id`         | `string` | Task ID.                                              |
| `name`        | `string` | Name of task.                                         |
| `author_id`   | `string` | Author ID of task.                                    |
| `project`     | `string` | Task project name.                                    |
| `timing`      | `string` | Time the task was completed.                          |
| `month`       | `string` | Month the task was completed.                         |
| `delivered`   | `string` | Date the task was completed. ISO8601 format required. |
| `description` | `string` | Description of the task.                              |

<br>

#### Get task

##### You can only read own tasks.

```
  GET /api/v1/tasks/${id}
```

| HTTP Headers    | Type           | Required | Description                                              |
| --------------- | -------------- | -------- | -------------------------------------------------------- |
| `Authorization` | `bearer token` | `true`   | Valid JWT token generated at login and stored in memory. |

| Request parameters | Type     | Required | Description |
| ------------------ | -------- | -------- | ----------- |
| `id`               | `string` | `true`   | Task ID.    |

<br>

#### Create task

```
  POST /api/v1/tasks
```

| HTTP Headers    | Type           | Required | Description                                              |
| --------------- | -------------- | -------- | -------------------------------------------------------- |
| `Authorization` | `bearer token` | `true`   | Valid JWT token generated at login and stored in memory. |

| Request body  | Type     | Required | Description                                           |
| ------------- | -------- | -------- | ----------------------------------------------------- |
| `name`        | `string` | `true`   | Name of task.                                         |
| `project`     | `string` | `true`   | Task project name.                                    |
| `timing`      | `string` | `true`   | Time the task was completed.                          |
| `month`       | `string` | `true`   | Month the task was completed.                         |
| `delivered`   | `string` | `false`  | Date the task was completed. ISO8601 format required. |
| `description` | `string` | `false`  | Description of the task.                              |

<br>

#### Update task

##### You can only update own tasks, even the admin can't update yours either.

```
  PATCH /api/v1/tasks/${id}
```

| HTTP Headers    | Type           | Required | Description                                              |
| --------------- | -------------- | -------- | -------------------------------------------------------- |
| `Authorization` | `bearer token` | `true`   | Valid JWT token generated at login and stored in memory. |

| Request parameters | Type     | Required | Description |
| ------------------ | -------- | -------- | ----------- |
| `id`               | `string` | `true`   | Task ID.    |

| Request body  | Type     | Required | Description                   |
| ------------- | -------- | -------- | ----------------------------- |
| `name`        | `string` | `true`   | Name of task.                 |
| `project`     | `string` | `true`   | Task project name.            |
| `timing`      | `string` | `true`   | Time the task was completed.  |
| `month`       | `string` | `true`   | Month the task was completed. |
| `delivered`   | `string` | `false`  | Date the task was completed.  |
| `description` | `string` | `false`  | Description of the task.      |

<br>

#### Delete task

##### You can only delete own tasks.

```
  DELETE /api/v1/tasks/${id}
```

| HTTP Headers    | Type           | Required | Description                                              |
| --------------- | -------------- | -------- | -------------------------------------------------------- |
| `Authorization` | `bearer token` | `true`   | Valid JWT token generated at login and stored in memory. |

| Request parameters | Type     | Required | Description |
| ------------------ | -------- | -------- | ----------- |
| `id`               | `string` | `true`   | ID task.    |

</details>

### Users API

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi eleifend turpis sit amet lacus porta elementum id id mi. Aenean sed dui sit amet risus euismod feugiat sit amet at dolor. Sed tristique volutpat ullamcorper.

<details>
<summary>See all details</summary>

#### Get all users

##### Only for users with administrator role.

```
  GET /api/v1/users
```

| HTTP Headers    | Type           | Required | Description                                              |
| --------------- | -------------- | -------- | -------------------------------------------------------- |
| `Authorization` | `bearer token` | `true`   | Valid JWT token generated at login and stored in memory. |

| Request parameters | Type     | Required | Description                               |
| ------------------ | -------- | -------- | ----------------------------------------- |
| `per_page`         | `string` | `false`  | The number of results to return per page. |
| `page`             | `string` | `false`  | Use this to page through the results.     |

| Response body         | Type      | Description                            |
| --------------------- | --------- | -------------------------------------- |
| `_id`                 | `string`  | User ID.                               |
| `username`            | `string`  | Name of user.                          |
| `role`                | `number`  | Role of user.                          |
| `email`               | `string`  | Valid email of new user.               |
| `avatar`              | `string`  | URL of image.                          |
| `confirmation_token`  | `string`  | Valid JWT token generated at registry. |
| `confirmation_status` | `boolean` | Account status.                        |

<br>

#### Get user

##### You can only read your own data. Full response for users with administrator role.

```
  GET /api/v1/users/${id}
```

| HTTP Headers    | Type           | Required | Description                                              |
| --------------- | -------------- | -------- | -------------------------------------------------------- |
| `Authorization` | `bearer token` | `true`   | Valid JWT token generated at login and stored in memory. |

| Request parameters | Type     | Required | Description |
| ------------------ | -------- | -------- | ----------- |
| `id`               | `string` | `true`   | User ID.    |

| Response body | Type     | Description              |
| ------------- | -------- | ------------------------ |
| `_id`         | `string` | User ID.                 |
| `username`    | `string` | Name of user.            |
| `email`       | `string` | Valid email of new user. |
| `avatar`      | `string` | URL of image.            |

<br>

#### Update user

##### You can only update your data, even the admin can't update you either.

```
  PATCH /api/v1/users/${id}
```

| HTTP Headers    | Type           | Required | Description                                              |
| --------------- | -------------- | -------- | -------------------------------------------------------- |
| `Authorization` | `bearer token` | `true`   | Valid JWT token generated at login and stored in memory. |

| Request parameters | Type     | Required | Description |
| ------------------ | -------- | -------- | ----------- |
| `id`               | `string` | `true`   | User ID.    |

| Request body | Type     | Required                 | Description |
| ------------ | -------- | ------------------------ | ----------- |
| `username`   | `string` | New name of user.        |
| `email`      | `string` | New valid email of user. |
| `avatar`     | `string` | URL of new image.        |

<br>

#### Delete user

##### Only for users with administrator role.

```
  DELETE /api/v1/users/${id}
```

| HTTP Headers    | Type           | Required | Description                                              |
| --------------- | -------------- | -------- | -------------------------------------------------------- |
| `Authorization` | `bearer token` | `true`   | Valid JWT token generated at login and stored in memory. |

| Request parameters | Type     | Required | Description |
| ------------------ | -------- | -------- | ----------- |
| `id`               | `string` | `true`   | User ID.    |

</details>

<br>

## Environment variables

To run this server, you must create an .env file in the root of your project with the following variables. Remember to also set these on your hosting when you go to production mode:

| Key                        | Type     | Description                                           |
| -------------------------- | -------- | ----------------------------------------------------- |
| `DATABASE`                 | `string` | Link to your MongoDB connection.                      |
| `PORT`                     | `number` | Port of your server.                                  |
| `ACCESS_KEY`               | `string` | Secret key to sign your access tokens.                |
| `REFRESH_KEY`              | `string` | Secret key to sign your refresh tokens.               |
| `CONFIRMATION_ACCOUNT_KEY` | `string` | Secret key to sign your confirmation account tokens.  |
| `RESET_PASSWORD_KEY`       | `string` | Secret key to sign your reset password tokens.        |
| `EMAIL_USER`               | `string` | Email account to be used with nodemailer.             |
| `EMAIL_PASS`               | `string` | Password of email account to be used with nodemailer. |
| `FRONTEND`                 | `string` | Link to your client side.                             |
| `MODE`                     | `string` | Dev or Prod.                                          |

To generate base64 secret keys you can use [_GeneratePlus_](https://generate.plus/en/base64).

<br>

## Roadmap

Keeping in mind that the reason of to be of this project is to learn, I want to continue expanding it and these are the next challenges.

- [x] Items per page and pagination params to GET requests.
- [ ] Refactor the code to use Postgres Database with Supabase instead of MongoDB and Google Firebase.
- [ ] Automatically calculate earned objectives based on the time it takes to complete a task.
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

<br>

## License

This project was developed under the **GPL-3.0 license**, see the [LICENSE](./LICENSE.md) file in the project root for the full license text.

<br>

## Acknowledgements

Thanks for these awesome resources that were used during the development:

- <https://mailtrap.io>
- <https://www.thunderclient.com>
- <https://www.postman.com>
- <https://www.grc.com/passwords.htm>
- <https://unlayer.com>
- <https://code.visualstudio.com>
- <https://yerbaverdeflor.com>

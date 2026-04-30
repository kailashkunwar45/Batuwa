-- Docker init script: creates test database alongside dev database
CREATE DATABASE kkollection_test;
GRANT ALL PRIVILEGES ON DATABASE kkollection_test TO kkuser;

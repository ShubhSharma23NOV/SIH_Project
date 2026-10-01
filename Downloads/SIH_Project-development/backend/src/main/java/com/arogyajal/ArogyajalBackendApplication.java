package com.arogyajal;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.mongo.MongoAutoConfiguration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(exclude = {MongoAutoConfiguration.class})
@EnableAsync
@EnableScheduling
public class ArogyajalBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(ArogyajalBackendApplication.class, args);
	}

}

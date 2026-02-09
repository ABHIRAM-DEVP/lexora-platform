package com.lexora.lexora_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import io.github.cdimascio.dotenv.Dotenv;

//mvn spring-boot:run -DskipTests

@SpringBootApplication
@EnableConfigurationProperties
@EnableTransactionManagement
public class LexoraBackendApplication {

	public static void main(String[] args) {
		Dotenv dotenv = Dotenv.load();
		dotenv.entries().forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));
		SpringApplication.run(LexoraBackendApplication.class, args);
	}

}
